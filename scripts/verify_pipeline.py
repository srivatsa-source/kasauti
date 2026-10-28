import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps" / "api"))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import init_db

async def test_full_pipeline():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health
        h = await client.get("/health")
        print("1. Health check:", h.json())

        # 2. Targets
        t = await client.get("/targets")
        targets = t.json()
        print("2. Targets count:", len(targets))
        assert len(targets) > 0, "Expected seeded target"
        target_id = targets[0]["id"]

        # 3. Runs
        r = await client.get("/runs")
        runs = r.json()
        print("3. Runs count:", len(runs))
        assert len(runs) > 0, "Expected seeded benchmark run"
        bench_run_id = runs[0]["id"]
        initial_score = runs[0]["purity_score"]
        print(f"   Benchmark Run ID: {bench_run_id}")
        print(f"   Initial Purity Score: {initial_score}%")
        print(f"   Passed: {runs[0]['passed_calls']} / {runs[0]['total_calls']}")

        # 4. Fix loop
        print("\n4. Proposing surgical prompt fix...")
        fix_resp = await client.post(f"/runs/{bench_run_id}/fix")
        assert fix_resp.status_code == 200, f"Fix failed: {fix_resp.text}"
        fix_data = fix_resp.json()
        print("   Fix created ID:", fix_data["id"])
        print(f"   Diff lines: {len(fix_data['diff'].splitlines())}")

        # 5. Rerun failed scenarios
        print("\n5. Triggering rerun of failed scenarios only...")
        rerun_resp = await client.post(f"/runs/{bench_run_id}/rerun")
        assert rerun_resp.status_code == 200, f"Rerun failed: {rerun_resp.text}"
        rerun_data = rerun_resp.json()
        rerun_id = rerun_data["id"]
        print(f"   Rerun initiated: ID={rerun_id}, status={rerun_data['status']}")

        print("   Waiting for rerun orchestrator to complete calls...")
        final_rerun_data = None
        for _ in range(40):
            await asyncio.sleep(0.5)
            chk = await client.get(f"/runs/{rerun_id}")
            data = chk.json()
            if data["status"] == "completed":
                final_rerun_data = data
                break

        assert final_rerun_data is not None, "Timed out waiting for rerun completion"
        print(f"   RERUN COMPLETED!")
        print(f"   Rerun Purity Score: {final_rerun_data['purity_score']}%")
        print(f"   Calls Passed: {final_rerun_data['passed_calls']} / {final_rerun_data['total_calls']}")
        assert final_rerun_data['purity_score'] > initial_score, "Purity score should improve after fix!"
        print(f"   Purity Score increased from {initial_score}% to {final_rerun_data['purity_score']}%!")

        # 6. PDF Report
        print("\n6. Testing PDF report export...")
        pdf = await client.get(f"/runs/{bench_run_id}/report.pdf")
        assert pdf.status_code == 200
        assert len(pdf.content) > 1000
        print(f"   PDF generated successfully! Size: {len(pdf.content)} bytes, Content-Type: {pdf.headers.get('content-type')}")

        print("\n========================================================")
        print("ALL END-TO-END PIPELINE CHECKS PASSED SUCCESSFULLY!")
        print("========================================================")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
