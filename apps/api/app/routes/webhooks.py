from typing import Dict, Any
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.db.session import get_db
from app.db.models import Call, Check, Scenario
from app.engine.rule_engine import RuleEngine
from app.engine.rubric_judge import RubricJudge

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

def is_ip_allowed(client_ip: str) -> bool:
    if settings.BOLNA_MODE.lower() == "mock":
        return True
    allowed = settings.webhook_allowed_ips
    # Strip any port or whitespace
    ip = client_ip.split(":")[0].strip()
    return ip in allowed

@router.post("/bolna")
async def handle_bolna_webhook(
    request: Request,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    # Check client IP
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Check X-Forwarded-For if behind a reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    if not is_ip_allowed(client_ip):
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Source IP {client_ip} is not in Bolna webhook allowlist."
        )

    exec_id = payload.get("id") or payload.get("execution_id")
    status = payload.get("status", "completed")

    if not exec_id:
        return {"status": "ignored", "reason": "No execution ID"}

    # Find matching call
    call_res = await db.execute(select(Call).where(Call.bolna_execution_id == exec_id))
    call = call_res.scalar_one_or_none()
    if not call:
        return {"status": "unmatched", "execution_id": exec_id}

    call.status = status
    if "transcript" in payload and payload["transcript"]:
        call.transcript = payload["transcript"]
    rec_url = payload.get("recording_url") or (payload.get("telephony_data") or {}).get("recording_url")
    if rec_url:
        call.recording_url = rec_url
    if "total_cost" in payload and payload["total_cost"] is not None:
        call.cost = float(payload["total_cost"])

    # If call completed and checks don't exist yet, evaluate
    chk_res = await db.execute(select(Check).where(Check.call_id == call.id))
    existing_checks = chk_res.scalars().all()

    if status == "completed" and not existing_checks:
        sc_res = await db.execute(select(Scenario).where(Scenario.id == call.scenario_id))
        scenario = sc_res.scalar_one_or_none()

        if scenario and call.transcript:
            rule_engine = RuleEngine()
            for r_id in scenario.rule_ids:
                res = rule_engine.evaluate_rule(
                    rule_id=r_id,
                    transcript=call.transcript,
                    call_timestamp=call.started_at
                )
                chk = Check(
                    call_id=call.id,
                    kind="rule",
                    rule_id=r_id,
                    passed=res.passed,
                    score=res.score,
                    evidence=res.evidence
                )
                db.add(chk)

            rubric_judge = RubricJudge()
            rubric_checks = await rubric_judge.judge_call(
                transcript=call.transcript,
                goal=scenario.goal,
                expected_outcome=scenario.expected_outcome,
                language=scenario.language
            )
            for rc in rubric_checks:
                chk = Check(
                    call_id=call.id,
                    kind="rubric",
                    rule_id=rc["rule_id"],
                    passed=rc["passed"],
                    score=rc["score"],
                    evidence=rc["evidence"]
                )
                db.add(chk)

    await db.commit()
    return {"status": "processed", "execution_id": exec_id}
