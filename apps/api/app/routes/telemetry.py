import re
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from app.config import settings

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
    turns: List[LiveTurn] = []
    total_turns: int = 0
    raw_transcript: str = ""

@router.get("/live", response_model=LiveExecutionResponse)
async def get_live_execution(agent_id: Optional[str] = None):
    """
    Fetches latest real execution data directly from the Bolna API
    for the active agent, parsing real user/assistant conversational turns.
    """
    effective_agent_id = agent_id or settings.BOLNA_CALLER_AGENT_ID or settings.BOLNA_STAGING_AGENT_ID
    if not effective_agent_id:
        raise HTTPException(status_code=400, detail="No active Bolna Agent ID configured.")
    if not settings.BOLNA_API_KEY:
        raise HTTPException(status_code=400, detail="BOLNA_API_KEY not configured.")

    headers = {
        "Authorization": f"Bearer {settings.BOLNA_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
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

            # Parse conversational turns: assistant: ... user: ...
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

            return LiveExecutionResponse(
                execution_id=latest.get("id", ""),
                status=latest.get("status", "completed"),
                created_at=latest.get("created_at"),
                duration=telephony.get("duration"),
                to_number=telephony.get("to_number"),
                from_number=telephony.get("from_number"),
                carrier=telephony.get("to_number_carrier"),
                recording_url=recording_url,
                turns=turns,
                total_turns=len(turns),
                raw_transcript=raw_transcript
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Bolna execution telemetry: {str(e)}")

