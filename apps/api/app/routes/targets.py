import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field, ConfigDict
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
    languages: List[str] = Field(default=["Hindi", "English", "Hinglish", "Kannada"])
    notes: Optional[str] = Field(None, json_schema_extra={"example": "System prompt and agent details"})

class TargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone_number: str
    bolna_agent_id: Optional[str] = None
    staging_agent_id: Optional[str] = None
    languages: List[str] = ["Hindi", "English"]
    notes: Optional[str] = None

@router.post("", response_model=TargetResponse)
async def create_target(payload: TargetCreate, db: AsyncSession = Depends(get_db)):
    target = Target(
        name=payload.name,
        phone_number=payload.phone_number,
        bolna_agent_id=payload.bolna_agent_id,
        staging_agent_id=payload.staging_agent_id,
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
            languages=["Hindi", "Hinglish", "Kannada", "Indian English"],
            notes="Primary Bolna outbound customer support voice agent."
        )
    ]

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
        languages=["Hindi", "Hinglish", "Kannada", "Indian English"],
        notes="Primary Bolna outbound customer support voice agent."
    )
