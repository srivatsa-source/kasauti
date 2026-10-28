import asyncio
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from app.db.session import get_db, AsyncSessionLocal
from app.db.models import Run, Target, Call, Check, Scenario, Fix
from app.engine.orchestrator import RunOrchestrator
from app.engine.fixer import PromptFixer
from app.report.pdf_generator import generate_run_pdf

router = APIRouter(prefix="/runs", tags=["runs"])

class RunCreate(BaseModel):
    target_id: str
    suite_name: str = Field(default="standard_trai_pack")
    scenario_ids: Optional[List[str]] = None

class ScenarioSummary(BaseModel):
    id: str
    title: str
    language: str
    persona: str
    goal: str
    expected_outcome: str

    class Config:
        from_attributes = True

class CheckSummary(BaseModel):
    id: str
    kind: str
    rule_id: Optional[str]
    passed: bool
    score: float
    evidence: Optional[str]

    class Config:
        from_attributes = True

class CallSummary(BaseModel):
    id: str
    scenario_id: str
    bolna_execution_id: Optional[str]
    status: str
    transcript: Optional[str]
    recording_url: Optional[str]
    cost: float
    scenario: Optional[ScenarioSummary]
    checks: List[CheckSummary]

    class Config:
        from_attributes = True

class FixSummary(BaseModel):
    id: str
    prompt_before: str
    prompt_after: str
    diff: str
    rerun_run_id: Optional[str]

    class Config:
        from_attributes = True

class RunDetailResponse(BaseModel):
    id: str
    target_id: str
    suite_name: str
    status: str
    purity_score: float
    total_calls: int
    passed_calls: int
    failed_calls: int
    created_at: Any
    target_name: Optional[str] = None
    target_phone: Optional[str] = None
    calls: List[CallSummary] = []
    fixes: List[FixSummary] = []

    class Config:
        from_attributes = True

async def _background_execute_run(run_id: str, scenario_ids: Optional[List[str]] = None):
    async with AsyncSessionLocal() as session:
        orchestrator = RunOrchestrator()
        await orchestrator.execute_run(session, run_id, scenario_ids)

@router.post("", response_model=RunDetailResponse)
async def create_run(
    payload: RunCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Verify target exists
    target_res = await db.execute(select(Target).where(Target.id == payload.target_id))
    target = target_res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    run = Run(
        target_id=payload.target_id,
        suite_name=payload.suite_name,
        status="queued"
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Launch background run execution
    background_tasks.add_task(_background_execute_run, run.id, payload.scenario_ids)

    return RunDetailResponse(
        id=run.id,
        target_id=run.target_id,
        suite_name=run.suite_name,
        status=run.status,
        purity_score=run.purity_score,
        total_calls=run.total_calls,
        passed_calls=run.passed_calls,
        failed_calls=run.failed_calls,
        created_at=run.created_at,
        target_name=target.name,
        target_phone=target.phone_number,
        calls=[],
        fixes=[]
    )

@router.get("", response_model=List[RunDetailResponse])
async def list_runs(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Run).order_by(Run.created_at.desc()))
    runs = res.scalars().all()
    results = []
    for r in runs:
        t_res = await db.execute(select(Target).where(Target.id == r.target_id))
        t = t_res.scalar_one_or_none()
        results.append(RunDetailResponse(
            id=r.id,
            target_id=r.target_id,
            suite_name=r.suite_name,
            status=r.status,
            purity_score=r.purity_score,
            total_calls=r.total_calls,
            passed_calls=r.passed_calls,
            failed_calls=r.failed_calls,
            created_at=r.created_at,
            target_name=t.name if t else None,
            target_phone=t.phone_number if t else None,
            calls=[],
            fixes=[]
        ))
    return results

@router.get("/{run_id}", response_model=RunDetailResponse)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Run).where(Run.id == run_id))
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    t_res = await db.execute(select(Target).where(Target.id == run.target_id))
    target = t_res.scalar_one_or_none()

    calls_res = await db.execute(select(Call).where(Call.run_id == run.id))
    calls = calls_res.scalars().all()

    calls_summary = []
    for c in calls:
        sc_res = await db.execute(select(Scenario).where(Scenario.id == c.scenario_id))
        sc = sc_res.scalar_one_or_none()

        chk_res = await db.execute(select(Check).where(Check.call_id == c.id))
        checks = chk_res.scalars().all()

        calls_summary.append(CallSummary(
            id=c.id,
            scenario_id=c.scenario_id,
            bolna_execution_id=c.bolna_execution_id,
            status=c.status,
            transcript=c.transcript,
            recording_url=c.recording_url,
            cost=c.cost,
            scenario=sc,
            checks=checks
        ))

    fixes_res = await db.execute(select(Fix).where(Fix.run_id == run.id))
    fixes = fixes_res.scalars().all()

    return RunDetailResponse(
        id=run.id,
        target_id=run.target_id,
        suite_name=run.suite_name,
        status=run.status,
        purity_score=run.purity_score,
        total_calls=run.total_calls,
        passed_calls=run.passed_calls,
        failed_calls=run.failed_calls,
        created_at=run.created_at,
        target_name=target.name if target else None,
        target_phone=target.phone_number if target else None,
        calls=calls_summary,
        fixes=fixes
    )

@router.post("/{run_id}/fix", response_model=FixSummary)
async def fix_run_prompt(run_id: str, db: AsyncSession = Depends(get_db)):
    fixer = PromptFixer()
    fix = await fixer.generate_and_apply_fix(db, run_id)
    return FixSummary(
        id=fix.id,
        prompt_before=fix.prompt_before,
        prompt_after=fix.prompt_after,
        diff=fix.diff,
        rerun_run_id=fix.rerun_run_id
    )

@router.post("/{run_id}/rerun", response_model=RunDetailResponse)
async def rerun_failed_scenarios(
    run_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Rerun ONLY the failed scenarios from run_id as a new run, linked to any active fix.
    """
    run_res = await db.execute(select(Run).where(Run.id == run_id))
    original_run = run_res.scalar_one_or_none()
    if not original_run:
        raise HTTPException(status_code=404, detail="Run not found")

    calls_res = await db.execute(select(Call).where(Call.run_id == original_run.id))
    calls = calls_res.scalars().all()

    failed_scenario_ids = []
    for c in calls:
        chk_res = await db.execute(select(Check).where(Check.call_id == c.id))
        checks = chk_res.scalars().all()
        if not checks or not all(chk.passed for chk in checks):
            failed_scenario_ids.append(c.scenario_id)

    if not failed_scenario_ids:
        raise HTTPException(status_code=400, detail="All scenarios passed in this run; nothing to rerun.")

    # Create new Rerun record
    rerun = Run(
        target_id=original_run.target_id,
        suite_name=f"{original_run.suite_name} (Rerun Fix)",
        status="queued"
    )
    db.add(rerun)
    await db.commit()
    await db.refresh(rerun)

    # Link rerun to the latest Fix record if one exists
    latest_fix_res = await db.execute(
        select(Fix).where(Fix.run_id == original_run.id).order_by(Fix.created_at.desc())
    )
    latest_fix = latest_fix_res.scalar_one_or_none()
    if latest_fix:
        latest_fix.rerun_run_id = rerun.id
        await db.commit()

    background_tasks.add_task(_background_execute_run, rerun.id, failed_scenario_ids)

    return RunDetailResponse(
        id=rerun.id,
        target_id=rerun.target_id,
        suite_name=rerun.suite_name,
        status=rerun.status,
        purity_score=rerun.purity_score,
        total_calls=rerun.total_calls,
        passed_calls=rerun.passed_calls,
        failed_calls=rerun.failed_calls,
        created_at=rerun.created_at,
        calls=[],
        fixes=[]
    )

@router.get("/{run_id}/report.pdf")
async def get_run_pdf_report(run_id: str, db: AsyncSession = Depends(get_db)):
    run_res = await db.execute(select(Run).where(Run.id == run_id))
    run = run_res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    t_res = await db.execute(select(Target).where(Target.id == run.target_id))
    target = t_res.scalar_one_or_none()

    calls_res = await db.execute(select(Call).where(Call.run_id == run.id))
    calls = calls_res.scalars().all()

    calls_data = []
    for c in calls:
        sc_res = await db.execute(select(Scenario).where(Scenario.id == c.scenario_id))
        sc = sc_res.scalar_one_or_none()
        chk_res = await db.execute(select(Check).where(Check.call_id == c.id))
        checks = chk_res.scalars().all()

        calls_data.append({
            "scenario_id": c.scenario_id,
            "status": c.status,
            "scenario": {
                "title": sc.title if sc else c.scenario_id,
                "language": sc.language if sc else "N/A"
            },
            "checks": [
                {
                    "kind": chk.kind,
                    "rule_id": chk.rule_id,
                    "passed": chk.passed,
                    "evidence": chk.evidence
                }
                for chk in checks
            ]
        })

    pdf_bytes = generate_run_pdf(
        run_data={
            "id": run.id,
            "purity_score": run.purity_score,
            "total_calls": run.total_calls,
            "passed_calls": run.passed_calls,
            "failed_calls": run.failed_calls
        },
        target_data={
            "name": target.name if target else "Unknown Target",
            "phone_number": target.phone_number if target else "N/A"
        },
        calls_data=calls_data
    )

    filename = f"Kasauti_Report_{run.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
