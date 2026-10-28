import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.bolna import get_bolna_client
from app.engine.rule_engine import RuleEngine
from app.engine.rubric_judge import RubricJudge
from app.engine.scenario_compiler import ScenarioCompiler
from app.db.models import Run, Call, Check, Target, Scenario

class RunOrchestrator:
    def __init__(self):
        self.bolna = get_bolna_client()
        self.rule_engine = RuleEngine()
        self.rubric_judge = RubricJudge()
        self.compiler = ScenarioCompiler()

    async def execute_run(
        self,
        db: AsyncSession,
        run_id: str,
        scenario_ids: Optional[List[str]] = None
    ) -> Run:
        # Load run
        run_res = await db.execute(select(Run).where(Run.id == run_id))
        run = run_res.scalar_one_or_none()
        if not run:
            raise ValueError(f"Run {run_id} not found")

        # Load target
        target_res = await db.execute(select(Target).where(Target.id == run.target_id))
        target = target_res.scalar_one_or_none()
        if not target:
            raise ValueError(f"Target {run.target_id} not found")

        run.status = "in_progress"
        await db.commit()

        # Determine scenarios to run
        if scenario_ids:
            scenarios = [self.compiler.get_scenario(s_id) for s_id in scenario_ids if self.compiler.get_scenario(s_id)]
        else:
            scenarios = self.compiler.list_scenarios()

        if not scenarios:
            run.status = "completed"
            await db.commit()
            return run

        agent_id = target.staging_agent_id or target.bolna_agent_id or "kasauti_staging_agent"

        # Pre-seed any missing scenarios into DB sequentially
        for sc in scenarios:
            s_id = sc["id"]
            sc_db_res = await db.execute(select(Scenario).where(Scenario.id == s_id))
            if not sc_db_res.scalar_one_or_none():
                db.add(Scenario(
                    id=s_id,
                    title=sc["title"],
                    language=sc["language"],
                    persona=sc["persona"],
                    goal=sc["goal"],
                    behavior_flags=sc.get("behavior_flags", []),
                    expected_outcome=sc["expected_outcome"],
                    rule_ids=sc.get("rule_ids", [])
                ))
        await db.commit()

        # Execute scenarios sequentially or with independent sessions
        for sc in scenarios:
            await self._execute_single_scenario(db, run, target, sc, agent_id)

        # Refresh and update run totals
        calls_res = await db.execute(select(Call).where(Call.run_id == run.id))
        all_calls = calls_res.scalars().all()

        total = len(all_calls)
        passed_count = 0
        failed_count = 0

        for c in all_calls:
            checks_res = await db.execute(select(Check).where(Check.call_id == c.id))
            checks = checks_res.scalars().all()
            all_passed = bool(checks) and all(chk.passed for chk in checks)
            if all_passed:
                passed_count += 1
            else:
                failed_count += 1

        run.total_calls = total
        run.passed_calls = passed_count
        run.failed_calls = failed_count
        run.purity_score = round((passed_count / total * 100.0), 1) if total > 0 else 0.0
        run.status = "completed"

        await db.commit()
        await db.refresh(run)
        return run

    async def _execute_single_scenario(
        self,
        db: AsyncSession,
        run: Run,
        target: Target,
        scenario: dict,
        agent_id: str
    ):
        scenario_id = scenario["id"]

        # Create Call record in DB
        call = Call(
            run_id=run.id,
            scenario_id=scenario_id,
            status="initiated",
            started_at=datetime.now(timezone.utc)
        )
        db.add(call)
        await db.commit()
        await db.refresh(call)

        try:
            # 1. Start Bolna Call
            context = {
                "scenario_id": scenario_id,
                "behavior_flags": scenario.get("behavior_flags", []),
                "language": scenario.get("language", "Hinglish"),
                "caller_persona": scenario.get("persona", ""),
                "expected_outcome": scenario.get("expected_outcome", "")
            }
            call_res = await self.bolna.start_call(
                agent_id=agent_id,
                recipient_phone_number=target.phone_number,
                context=context
            )
            exec_id = call_res.get("execution_id")
            call.bolna_execution_id = exec_id
            await db.commit()

            # 2. Wait for completion (MockBolnaClient completes in ~1.2s; Real client polls)
            execution_data = None
            for _ in range(30):
                await asyncio.sleep(0.4)
                data = await self.bolna.get_execution(exec_id)
                if data.get("status") in ("completed", "failed", "canceled", "stopped"):
                    execution_data = data
                    break

            if not execution_data:
                execution_data = await self.bolna.get_execution(exec_id)

            call.status = execution_data.get("status", "completed")
            call.transcript = execution_data.get("transcript", "")
            call.recording_url = execution_data.get("recording_url")
            call.cost = float(execution_data.get("total_cost", 0.03))
            call.ended_at = datetime.now(timezone.utc)
            await db.commit()

            # 3. Rule Evaluation (Deterministic)
            assigned_rules = scenario.get("rule_ids", [])
            for r_id in assigned_rules:
                res = self.rule_engine.evaluate_rule(
                    rule_id=r_id,
                    transcript=call.transcript or "",
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

            # 4. Rubric Evaluation (LLM Judge)
            rubric_checks = await self.rubric_judge.judge_call(
                transcript=call.transcript or "",
                goal=scenario.get("goal", ""),
                expected_outcome=scenario.get("expected_outcome", ""),
                language=scenario.get("language", "Hinglish")
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

        except Exception as e:
            call.status = "failed"
            chk = Check(
                call_id=call.id,
                kind="rule",
                rule_id="execution_error",
                passed=False,
                score=0.0,
                evidence=f"Execution exception: {str(e)}"
            )
            db.add(chk)
            await db.commit()
