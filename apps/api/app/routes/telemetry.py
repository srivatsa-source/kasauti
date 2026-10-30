import re
import io
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from app.config import settings
from app.db.supabase_client import supabase_service

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

class LiveTurn(BaseModel):
    index: int
    speaker: str
    text: str

class LiveExecutionResponse(BaseModel):
    execution_id: str
    status: str
    created_at: Optional[str] = None
    duration: Optional[float] = None
    to_number: Optional[str] = None
    from_number: Optional[str] = None
    carrier: Optional[str] = None
    recording_url: Optional[str] = None
    storage_url: Optional[str] = None
    turns: List[LiveTurn] = []
    total_turns: int = 0
    raw_transcript: str = ""

@router.get("/live", response_model=LiveExecutionResponse)
async def get_live_execution(agent_id: Optional[str] = None, execution_id: Optional[str] = None):
    """
    Fetches real execution logs, call recordings, and conversational turns
    directly from the Bolna API (https://api.bolna.ai/v2/executions/{id} or /agent/{agent_id}/executions)
    and persists call telemetry and audio artifacts to Supabase.
    """
    if not settings.BOLNA_API_KEY:
        raise HTTPException(status_code=400, detail="BOLNA_API_KEY not configured.")

    headers = {
        "Authorization": f"Bearer {settings.BOLNA_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            latest = None
            if execution_id:
                # Query specific execution by ID
                resp = await client.get(
                    f"{settings.BOLNA_BASE_URL.rstrip('/')}/v2/executions/{execution_id}",
                    headers=headers
                )
                if resp.status_code == 200:
                    latest = resp.json()
                else:
                    # Fallback to /executions/{id}
                    resp2 = await client.get(
                        f"{settings.BOLNA_BASE_URL.rstrip('/')}/executions/{execution_id}",
                        headers=headers
                    )
                    if resp2.status_code == 200:
                        latest = resp2.json()
                    else:
                        raise HTTPException(status_code=resp.status_code, detail=f"Bolna execution fetch failed: {resp.text}")
            else:
                effective_agent_id = agent_id or settings.BOLNA_CALLER_AGENT_ID or settings.BOLNA_STAGING_AGENT_ID
                if not effective_agent_id:
                    raise HTTPException(status_code=400, detail="No active Bolna Agent ID configured.")

                resp = await client.get(
                    f"{settings.BOLNA_BASE_URL.rstrip('/')}/agent/{effective_agent_id}/executions",
                    headers=headers
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail=f"Bolna API error: {resp.text}")

                executions = resp.json()
                if not executions:
                    return LiveExecutionResponse(
                        execution_id="none",
                        status="idle",
                        raw_transcript="No executions found on Bolna for this agent.",
                        turns=[]
                    )
                latest = executions[0]

            raw_transcript = latest.get("transcript") or ""
            telephony = latest.get("telephony_data") or {}
            exec_id = latest.get("id") or execution_id or "unknown"

            # Parse real conversational turns: assistant: ... user: ...
            turns: List[LiveTurn] = []
            parts = re.split(r'\n(?=(?:assistant|user|bot|agent):\s*)', raw_transcript, flags=re.IGNORECASE)
            for idx, p in enumerate(parts):
                p = p.strip()
                if not p:
                    continue
                m = re.match(r'^(assistant|user|bot|agent):\s*(.*)', p, re.DOTALL | re.IGNORECASE)
                if m:
                    spk = "agent" if m.group(1).lower() in ("assistant", "bot", "agent") else "user"
                    txt = m.group(2).strip()
                    turns.append(LiveTurn(index=idx, speaker=spk, text=txt))

            recording_url = latest.get("recording_url") or telephony.get("recording_url")
            storage_url = None

            # Persist call recording to Supabase Storage if available
            if recording_url and supabase_service.is_configured:
                try:
                    audio_resp = await client.get(recording_url, follow_redirects=True, timeout=30.0)
                    if audio_resp.status_code == 200 and audio_resp.content:
                        storage_url = await supabase_service.upload_audio_artifact(
                            file_bytes=audio_resp.content,
                            destination_path=f"recordings/{exec_id}.wav",
                            content_type="audio/wav"
                        )
                except Exception as upload_err:
                    storage_url = None

            # Persist run to Supabase benchmark_runs
            turns_json = [{"speaker": t.speaker, "text": t.text, "index": t.index} for t in turns]
            if supabase_service.is_configured and exec_id != "unknown":
                await supabase_service.insert_record("benchmark_runs", {
                    "id": exec_id,
                    "target_id": settings.BOLNA_TARGET_AGENT_ID or "target-default",
                    "bolna_execution_id": exec_id,
                    "status": latest.get("status", "completed"),
                    "purity_score": 100.0,
                    "audio_storage_url": storage_url or recording_url,
                    "bolna_transcript_jsonb": turns_json,
                    "trai_compliance_jsonb": {"total_turns": len(turns)},
                    "created_at": latest.get("created_at")
                })

            return LiveExecutionResponse(
                execution_id=exec_id,
                status=latest.get("status", "completed"),
                created_at=latest.get("created_at"),
                duration=telephony.get("duration"),
                to_number=telephony.get("to_number"),
                from_number=telephony.get("from_number"),
                carrier=telephony.get("to_number_carrier"),
                recording_url=recording_url,
                storage_url=storage_url,
                turns=turns,
                total_turns=len(turns),
                raw_transcript=raw_transcript
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Bolna execution telemetry: {str(e)}")
