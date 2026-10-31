import logging
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field, ConfigDict
import httpx
from app.db.session import get_db
from app.db.models import Target
from app.config import settings

logger = logging.getLogger("kasauti.targets")

router = APIRouter(prefix="/targets", tags=["targets"])

class TargetCreate(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "HDFC Loan Assist Agent"})
    phone_number: str = Field(..., json_schema_extra={"example": "+919876543210"})
    bolna_agent_id: Optional[str] = Field(None, json_schema_extra={"example": "agent_prod_123"})
    staging_agent_id: Optional[str] = Field(None, json_schema_extra={"example": "agent_staging_123"})
    bolna_api_key: Optional[str] = Field(None, json_schema_extra={"example": "bn-123..."})
    languages: List[str] = Field(default=["Hindi", "English", "Hinglish", "Kannada"])
    notes: Optional[str] = Field(None, json_schema_extra={"example": "System prompt and agent details"})

class TargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone_number: str
    bolna_agent_id: Optional[str] = None
    staging_agent_id: Optional[str] = None
    bolna_api_key: Optional[str] = None
    languages: List[str] = ["Hindi", "English"]
    notes: Optional[str] = None

class FetchBolnaAgentsRequest(BaseModel):
    api_key: Optional[str] = None

class BolnaAgentItem(BaseModel):
    id: str
    name: str
    welcome_message: Optional[str] = None
    agent_type: Optional[str] = None
    inbound_phone_number: Optional[str] = None
    languages: List[str] = ["Hindi", "English"]
    updated_at: Optional[str] = None

class ImportBolnaAgentsRequest(BaseModel):
    api_key: Optional[str] = None
    phone_number: Optional[str] = None
    agent_ids: Optional[List[str]] = None

@router.post("", response_model=TargetResponse)
async def create_target(payload: TargetCreate, db: AsyncSession = Depends(get_db)):
    target = Target(
        name=payload.name,
        phone_number=payload.phone_number,
        bolna_agent_id=payload.bolna_agent_id,
        staging_agent_id=payload.staging_agent_id,
        bolna_api_key=payload.bolna_api_key,
        languages=payload.languages,
        notes=payload.notes
    )
    db.add(target)
    await db.commit()
    await db.refresh(target)
    return target

@router.get("", response_model=List[TargetResponse])
async def list_targets(db: AsyncSession = Depends(get_db)):
    # 1. Query relational DB
    try:
        res = await db.execute(select(Target).order_by(Target.created_at.desc()))
        targets = res.scalars().all()
        if targets:
            return targets
    except Exception as e:
        logger.warning(f"Error querying relational Target table: {e}")

    # 2. Check Supabase client table
    try:
        from app.db.supabase_client import supabase_service
        if supabase_service.is_configured and supabase_service.client:
            s_res = supabase_service.client.table("targets").select("*").execute()
            if s_res.data:
                return [TargetResponse(**t) for t in s_res.data]
    except Exception as e:
        logger.warning(f"Error querying Supabase targets table: {e}")

    # 3. Fallback to active environment configured Bolna target
    live_agent_id = settings.BOLNA_CALLER_AGENT_ID or settings.BOLNA_STAGING_AGENT_ID or "74bbf2a4-6561-48de-aec3-aafc7153bcd7"
    live_phone = settings.BOLNA_TARGET_PHONE or "+919019823296"
    return [
        TargetResponse(
            id="default-bolna-target",
            name="Kasauti CSA (Bolna Telephony Agent)",
            phone_number=live_phone,
            bolna_agent_id=live_agent_id,
            staging_agent_id=settings.BOLNA_STAGING_AGENT_ID or live_agent_id,
            bolna_api_key=settings.BOLNA_API_KEY,
            languages=["Hindi", "Hinglish", "Kannada", "Indian English"],
            notes="Primary Bolna outbound customer support voice agent."
        )
    ]

@router.post("/fetch-bolna-agents", response_model=List[BolnaAgentItem])
async def fetch_bolna_agents(payload: FetchBolnaAgentsRequest):
    """
    Connects to Bolna API using user-supplied API key or system default
    and lists all voice agents in that account.
    """
    key = payload.api_key or settings.BOLNA_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="Bolna API key is required to query agents.")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    url = f"{settings.BOLNA_BASE_URL.rstrip('/')}/v2/agent/all"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                resp = await client.get(f"{settings.BOLNA_BASE_URL.rstrip('/')}/agent/all", headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"Failed to fetch agents from Bolna: {resp.text}")

            data = resp.json()
            results = []
            for a in data:
                langs = ["Hindi", "English"]
                raw_str = str(a).lower()
                if "kannada" in raw_str:
                    langs.append("Kannada")
                if "hinglish" in raw_str:
                    langs.append("Hinglish")

                results.append(BolnaAgentItem(
                    id=a.get("id"),
                    name=a.get("agent_name") or "Unnamed Bolna Agent",
                    welcome_message=a.get("agent_welcome_message"),
                    agent_type=a.get("agent_type"),
                    inbound_phone_number=a.get("inbound_phone_number"),
                    languages=langs,
                    updated_at=str(a.get("updated_at")) if a.get("updated_at") else None
                ))
            return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Bolna agents: {e}")
        raise HTTPException(status_code=500, detail=f"Could not connect to Bolna: {str(e)}")

@router.post("/import-bolna-agents", response_model=List[TargetResponse])
async def import_bolna_agents(payload: ImportBolnaAgentsRequest, db: AsyncSession = Depends(get_db)):
    """
    Imports all or selected agents from a Bolna account into Kasauti targets,
    ready for live benchmark testing.
    """
    key = payload.api_key or settings.BOLNA_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="Bolna API key is required to import agents.")

    phone = payload.phone_number or settings.BOLNA_TARGET_PHONE or "+919019823296"

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    url = f"{settings.BOLNA_BASE_URL.rstrip('/')}/v2/agent/all"
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                resp = await client.get(f"{settings.BOLNA_BASE_URL.rstrip('/')}/agent/all", headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"Bolna API error: {resp.text}")
            agents = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Bolna API: {str(e)}")

    if not agents:
        return []

    imported_targets = []
    selected_ids = set(payload.agent_ids) if payload.agent_ids else None

    for a in agents:
        aid = a.get("id")
        if not aid:
            continue
        if selected_ids and aid not in selected_ids:
            continue

        agent_name = a.get("agent_name") or f"Bolna Agent {aid[:8]}"

        res = await db.execute(select(Target).where(Target.bolna_agent_id == aid))
        existing = res.scalar_one_or_none()

        langs = ["Hindi", "English", "Hinglish", "Kannada"]

        if existing:
            existing.name = agent_name
            existing.phone_number = phone
            existing.bolna_api_key = key
            existing.languages = langs
            existing.notes = f"Imported from Bolna account. Type: {a.get('agent_type', 'voice')}."
            target_obj = existing
        else:
            target_obj = Target(
                name=agent_name,
                phone_number=phone,
                bolna_agent_id=aid,
                staging_agent_id=aid,
                bolna_api_key=key,
                languages=langs,
                notes=f"Imported from Bolna account. Type: {a.get('agent_type', 'voice')}."
            )
            db.add(target_obj)

        imported_targets.append(target_obj)

    await db.commit()
    for t in imported_targets:
        await db.refresh(t)

    return imported_targets

@router.delete("/{target_id}")
async def delete_target(target_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Target).where(Target.id == target_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    await db.delete(target)
    await db.commit()
    return {"status": "deleted", "id": target_id}

@router.get("/{target_id}", response_model=TargetResponse)
async def get_target(target_id: str, db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(Target).where(Target.id == target_id))
        target = res.scalar_one_or_none()
        if target:
            return target
    except Exception as e:
        logger.warning(f"Error finding target {target_id}: {e}")

    # Check fallback
    live_agent_id = settings.BOLNA_CALLER_AGENT_ID or settings.BOLNA_STAGING_AGENT_ID or "74bbf2a4-6561-48de-aec3-aafc7153bcd7"
    live_phone = settings.BOLNA_TARGET_PHONE or "+919019823296"
    return TargetResponse(
        id=target_id,
        name="Kasauti CSA (Bolna Telephony Agent)",
        phone_number=live_phone,
        bolna_agent_id=live_agent_id,
        staging_agent_id=settings.BOLNA_STAGING_AGENT_ID or live_agent_id,
        bolna_api_key=settings.BOLNA_API_KEY,
        languages=["Hindi", "Hinglish", "Kannada", "Indian English"],
        notes="Primary Bolna outbound customer support voice agent."
    )
