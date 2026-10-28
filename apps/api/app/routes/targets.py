from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.db.models import Target

router = APIRouter(prefix="/targets", tags=["targets"])

class TargetCreate(BaseModel):
    name: str = Field(..., example="HDFC Loan Assist Agent")
    phone_number: str = Field(..., example="+919876543210")
    bolna_agent_id: Optional[str] = Field(None, example="agent_prod_123")
    staging_agent_id: Optional[str] = Field(None, example="agent_staging_123")
    languages: List[str] = Field(default=["Hindi", "English", "Hinglish", "Kannada"])
    notes: Optional[str] = Field(None, example="System prompt and agent details")

class TargetResponse(BaseModel):
    id: str
    name: str
    phone_number: str
    bolna_agent_id: Optional[str]
    staging_agent_id: Optional[str]
    languages: List[str]
    notes: Optional[str]

    class Config:
        from_attributes = True

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
    res = await db.execute(select(Target).order_by(Target.created_at.desc()))
    return res.scalars().all()

@router.get("/{target_id}", response_model=TargetResponse)
async def get_target(target_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Target).where(Target.id == target_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target
