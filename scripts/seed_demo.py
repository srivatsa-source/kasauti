import asyncio
import sys
from pathlib import Path

# Ensure api directory is in python path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.db.session import AsyncSessionLocal, init_db
from app.db.models import Target, Run
from app.engine.orchestrator import RunOrchestrator

async def seed():
    print("Initializing Kasauti Database...")
    await init_db()

    async with AsyncSessionLocal() as session:
        print("Creating Demo Voice Target: 'Bharat FinServe Loan Assistant'...")
        target = Target(
            name="Bharat FinServe Loan Assistant",
            phone_number="+919876543210",
            bolna_agent_id="bolna_agent_bharat_prod",
            staging_agent_id="kasauti_staging_bharat",
            languages=["Hindi", "Hinglish", "Kannada", "Indian English"],
            notes="You are an outbound customer service agent for Bharat FinServe assisting with loan inquiries."
        )
        session.add(target)
        await session.commit()
        await session.refresh(target)
        print(f"[OK] Target created: ID={target.id}")

        print("Executing initial benchmark test run (all 12 scenarios in mock mode)...")
        run = Run(
            target_id=target.id,
            suite_name="TRAI Standard Regulatory & Behavioral Pack",
            status="queued"
        )
        session.add(run)
        await session.commit()
        await session.refresh(run)

        orchestrator = RunOrchestrator()
        completed_run = await orchestrator.execute_run(session, run.id)

        print("\n" + "=" * 50)
        print("KASAUTI BENCHMARK RUN COMPLETED")
        print("=" * 50)
        print(f"Run ID:        {completed_run.id}")
        print(f"Total Calls:   {completed_run.total_calls}")
        print(f"Passed Calls:  {completed_run.passed_calls}")
        print(f"Failed Calls:  {completed_run.failed_calls}")
        print(f"Purity Score:  {completed_run.purity_score}%")
        print("=" * 50)
        print("Seeded successfully! Start the frontend to view this run live.")

if __name__ == "__main__":
    asyncio.run(seed())
