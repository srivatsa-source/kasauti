from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.llm import get_llm_client
from app.bolna import get_bolna_client
from app.db.models import Run, Call, Check, Fix, Target

class PromptFixer:
    def __init__(self):
        self.llm_client = get_llm_client()
        self.bolna_client = get_bolna_client()

    async def generate_and_apply_fix(
        self,
        db: AsyncSession,
        run_id: str,
        current_prompt: Optional[str] = None
    ) -> Fix:
        # Load run and target
        run_stmt = select(Run).where(Run.id == run_id)
        run_res = await db.execute(run_stmt)
        run = run_res.scalar_one_or_none()
        if not run:
            raise ValueError(f"Run {run_id} not found")

        target_stmt = select(Target).where(Target.id == run.target_id)
        target_res = await db.execute(target_stmt)
        target = target_res.scalar_one_or_none()

        # Gather failed checks and transcripts
        calls_stmt = select(Call).where(Call.run_id == run_id)
        calls_res = await db.execute(calls_stmt)
        calls = calls_res.scalars().all()

        failed_checks_summary = []
        failed_transcripts = []

        for call in calls:
            checks_stmt = select(Check).where(Check.call_id == call.id, Check.passed == False)
            checks_res = await db.execute(checks_stmt)
            failed_checks = checks_res.scalars().all()

            if failed_checks:
                if call.transcript:
                    failed_transcripts.append(call.transcript)
                for c in failed_checks:
                    failed_checks_summary.append({
                        "scenario_id": call.scenario_id,
                        "kind": c.kind,
                        "rule_or_rubric": c.rule_id,
                        "evidence": c.evidence
                    })

        prompt_before = current_prompt or (
            target.notes if target and target.notes else "You are a customer service voice agent."
        )

        proposal = await self.llm_client.propose_prompt_fix(
            current_prompt=prompt_before,
            failed_checks=failed_checks_summary,
            failed_transcripts=failed_transcripts
        )

        # STRICT TARGET PROTECTION:
        # Fixes MUST only be applied to a distinct staging agent, NEVER the production target.
        staging_agent_id = (
            (target.staging_agent_id if target else None)
            or settings.BOLNA_STAGING_AGENT_ID
            or ("mock_staging_agent" if settings.BOLNA_MODE.lower() == "mock" else None)
        )

        if not staging_agent_id:
            raise ValueError("No staging agent configured! Cannot apply fix to production agent.")

        # Hard guard against matching target agent
        if target and target.bolna_agent_id and staging_agent_id == target.bolna_agent_id:
            raise ValueError(
                f"SAFETY VIOLATION: Staging agent ID ({staging_agent_id}) matches production target agent ID! "
                "Fixes may only be applied to a distinct staging agent."
            )
        if settings.BOLNA_TARGET_AGENT_ID and staging_agent_id == settings.BOLNA_TARGET_AGENT_ID:
            raise ValueError(
                f"SAFETY VIOLATION: Staging agent ID ({staging_agent_id}) matches BOLNA_TARGET_AGENT_ID! "
                "Fixes may only be applied to a distinct staging agent."
            )

        await self.bolna_client.update_staging_agent(
            agent_id=staging_agent_id,
            patch_data={
                "agent_prompts": {
                    "task_1": {
                        "system_prompt": proposal.prompt_after
                    }
                }
            }
        )

        # Create Fix record
        fix = Fix(
            run_id=run.id,
            prompt_before=proposal.prompt_before,
            prompt_after=proposal.prompt_after,
            diff=proposal.diff
        )
        db.add(fix)
        await db.commit()
        await db.refresh(fix)
        return fix
