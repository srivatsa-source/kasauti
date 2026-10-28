import pytest
import uuid
from app.config import settings
from app.bolna.mock_client import MockBolnaClient
from app.bolna.real_client import RealBolnaClient
from app.engine.fixer import PromptFixer
from app.db.models import Target, Run, Call, Check
from app.db.session import init_db, AsyncSessionLocal

@pytest.mark.asyncio
async def test_mock_client_refuses_to_patch_target_agent():
    original = settings.BOLNA_TARGET_AGENT_ID
    try:
        settings.BOLNA_TARGET_AGENT_ID = "target_prod_123"
        client = MockBolnaClient()

        with pytest.raises(ValueError, match="Refusing to patch target agent"):
            await client.update_staging_agent(
                agent_id="target_prod_123",
                patch_data={"agent_prompts": {"task_1": {"system_prompt": "new prompt"}}}
            )
    finally:
        settings.BOLNA_TARGET_AGENT_ID = original

@pytest.mark.asyncio
async def test_real_client_refuses_to_patch_target_agent(monkeypatch):
    original = settings.BOLNA_TARGET_AGENT_ID
    try:
        settings.BOLNA_TARGET_AGENT_ID = "target_prod_999"
        monkeypatch.setattr(settings, "BOLNA_API_KEY", "fake_key_for_test")
        client = RealBolnaClient(confirmed_by_user=True)

        with pytest.raises(ValueError, match="Refusing to patch target agent"):
            await client.update_staging_agent(
                agent_id="target_prod_999",
                patch_data={"agent_prompts": {"task_1": {"system_prompt": "new prompt"}}}
            )
    finally:
        settings.BOLNA_TARGET_AGENT_ID = original

@pytest.mark.asyncio
async def test_staging_agent_update_succeeds_on_distinct_staging_id():
    original = settings.BOLNA_TARGET_AGENT_ID
    try:
        settings.BOLNA_TARGET_AGENT_ID = "target_prod_123"
        client = MockBolnaClient()

        res = await client.update_staging_agent(
            agent_id="staging_agent_456",
            patch_data={"agent_prompts": {"task_1": {"system_prompt": "Safe Staging Prompt"}}}
        )
        assert res["status"] == "updated"
        assert client.get_agent_prompt("staging_agent_456") == "Safe Staging Prompt"
    finally:
        settings.BOLNA_TARGET_AGENT_ID = original

@pytest.mark.asyncio
async def test_prompt_fixer_blocks_patch_if_target_and_staging_ids_match():
    await init_db()
    original = settings.BOLNA_TARGET_AGENT_ID
    try:
        # Use unique IDs per test run to avoid UNIQUE constraint collisions
        unique = uuid.uuid4().hex[:8]
        target_id = f"target_safety_{unique}"
        run_id = f"run_safety_{unique}"
        call_id = f"call_safety_{unique}"

        settings.BOLNA_TARGET_AGENT_ID = "identical_agent_id"

        async with AsyncSessionLocal() as session:
            target = Target(
                id=target_id,
                name="Safety Guard Target",
                phone_number="+919999999999",
                bolna_agent_id="identical_agent_id",
                staging_agent_id="identical_agent_id"
            )
            session.add(target)

            run = Run(
                id=run_id,
                target_id=target.id,
                status="completed"
            )
            session.add(run)

            call = Call(
                id=call_id,
                run_id=run.id,
                scenario_id="sc_safety",
                status="completed",
                transcript="Agent: Hello"
            )
            session.add(call)

            chk = Check(
                call_id=call.id,
                kind="rule",
                rule_id="ai_disclosure_early",
                passed=False,
                score=0.0,
                evidence="Failed"
            )
            session.add(chk)
            await session.commit()

            fixer = PromptFixer()
            with pytest.raises(ValueError, match="SAFETY VIOLATION"):
                await fixer.generate_and_apply_fix(session, run.id)

            # Clean up test rows
            await session.delete(chk)
            await session.delete(call)
            await session.delete(run)
            await session.delete(target)
            await session.commit()
    finally:
        settings.BOLNA_TARGET_AGENT_ID = original
