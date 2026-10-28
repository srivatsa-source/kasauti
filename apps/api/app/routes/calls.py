from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Call, Check, Scenario

router = APIRouter(prefix="/calls", tags=["calls"])

class CheckResponse(BaseModel):
    id: str
    kind: str
    rule_id: Optional[str]
    passed: bool
    score: float
    evidence: Optional[str]

    class Config:
        from_attributes = True

class ScenarioInfo(BaseModel):
    id: str
    title: str
    language: str
    persona: str
    goal: str
    behavior_flags: List[str]
    expected_outcome: str
    rule_ids: List[str]

    class Config:
        from_attributes = True

class CallDetailResponse(BaseModel):
    id: str
    run_id: str
    scenario_id: str
    bolna_execution_id: Optional[str]
    status: str
    transcript: Optional[str]
    recording_url: Optional[str]
    cost: float
    scenario: Optional[ScenarioInfo]
    checks: List[CheckResponse]

    class Config:
        from_attributes = True

@router.get("/{call_id}", response_model=CallDetailResponse)
async def get_call_detail(call_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Call).where(Call.id == call_id))
    call = res.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    sc_res = await db.execute(select(Scenario).where(Scenario.id == call.scenario_id))
    scenario = sc_res.scalar_one_or_none()

    chk_res = await db.execute(select(Check).where(Check.call_id == call.id))
    checks = chk_res.scalars().all()

    return CallDetailResponse(
        id=call.id,
        run_id=call.run_id,
        scenario_id=call.scenario_id,
        bolna_execution_id=call.bolna_execution_id,
        status=call.status,
        transcript=call.transcript,
        recording_url=call.recording_url,
        cost=call.cost,
        scenario=scenario,
        checks=checks
    )
