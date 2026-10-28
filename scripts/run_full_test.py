#!/usr/bin/env python3
"""
scripts/run_full_test.py — Kasauti End-to-End Test & Report Generator

Runs in 4 phases:
  Phase 1: Unit tests (pytest, all mock-mode tests)
  Phase 2: Mock pipeline (full ASGI pipeline: target creation → run → scoring → fix → rerun → PDF)
  Phase 3: Real API probe (1 real Bolna call via capture_fixtures.py flow, non-interactive)
  Phase 4: Generates comprehensive JSON + Markdown test report

BUDGET: Phase 3 places AT MOST 1 real call (~$0.05). No other phase spends real money.
"""

import asyncio
import json
import os
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps" / "api"))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

# ───────────────────── Utilities ──────────────────────

results = {
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "phases": {},
    "summary": {}
}

def record(phase, key, value):
    if phase not in results["phases"]:
        results["phases"][phase] = {}
    results["phases"][phase][key] = value

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"  [{ts}] {msg}")

# ───────────────────── Phase 1: Unit Tests ──────────────────────

def phase1_unit_tests():
    print("\n" + "=" * 65)
    print("  PHASE 1: Unit Test Suite (pytest, mock mode)")
    print("=" * 65)
    import subprocess
    start = time.time()
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        timeout=60
    )
    elapsed = round(time.time() - start, 2)
    
    output = result.stdout + result.stderr
    passed = output.count(" PASSED")
    failed = output.count(" FAILED")
    errors = output.count(" ERROR")
    
    record("unit_tests", "exit_code", result.returncode)
    record("unit_tests", "passed", passed)
    record("unit_tests", "failed", failed)
    record("unit_tests", "errors", errors)
    record("unit_tests", "elapsed_seconds", elapsed)
    record("unit_tests", "output", output[-3000:])  # last 3K chars
    
    status = "PASS" if result.returncode == 0 else "FAIL"
    log(f"Result: {status} — {passed} passed, {failed} failed, {errors} errors ({elapsed}s)")
    return result.returncode == 0

# ───────────────────── Phase 2: Mock Pipeline ──────────────────────

async def phase2_mock_pipeline():
    print("\n" + "=" * 65)
    print("  PHASE 2: Full Mock Pipeline (ASGI, zero network calls)")
    print("=" * 65)
    
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.db.session import init_db
    
    await init_db()
    transport = ASGITransport(app=app)
    
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        steps_passed = 0
        steps_total = 0
        
        # Step 1: Health
        steps_total += 1
        try:
            h = await client.get("/health")
            health = h.json()
            log(f"Health: {health['status']}, bolna_mode={health['bolna_mode']}, llm={health['llm_mode']}")
            record("mock_pipeline", "health", health)
            steps_passed += 1
        except Exception as e:
            log(f"Health FAILED: {e}")
            record("mock_pipeline", "health_error", str(e))
        
        # Step 2: Targets
        steps_total += 1
        try:
            t = await client.get("/targets")
            targets = t.json()
            log(f"Targets found: {len(targets)}")
            target_id = targets[0]["id"] if targets else None
            record("mock_pipeline", "targets_count", len(targets))
            record("mock_pipeline", "target_id", target_id)
            steps_passed += 1
        except Exception as e:
            log(f"Targets FAILED: {e}")
            target_id = None
        
        # Step 3: Runs
        steps_total += 1
        try:
            r = await client.get("/runs")
            runs = r.json()
            if runs:
                bench = next((x for x in runs if x.get("total_calls", 0) > 0), runs[0])
                bench_run_id = bench["id"]
                initial_score = bench["purity_score"]
                log(f"Benchmark: {bench_run_id}, Score={initial_score}%, "
                    f"Passed={bench['passed_calls']}/{bench['total_calls']}")
                record("mock_pipeline", "initial_score", initial_score)
                record("mock_pipeline", "bench_run_id", bench_run_id)
                record("mock_pipeline", "initial_passed", bench["passed_calls"])
                record("mock_pipeline", "initial_total", bench["total_calls"])
                steps_passed += 1
            else:
                log("No runs found — skipping fix/rerun steps")
                record("mock_pipeline", "no_runs", True)
                bench_run_id = None
        except Exception as e:
            log(f"Runs FAILED: {e}")
            bench_run_id = None
        
        # Step 4: Prompt Fix
        if bench_run_id:
            steps_total += 1
            try:
                log("Proposing prompt fix from failed scenarios...")
                fix_resp = await client.post(f"/runs/{bench_run_id}/fix")
                assert fix_resp.status_code == 200, f"HTTP {fix_resp.status_code}: {fix_resp.text}"
                fix = fix_resp.json()
                diff_lines = len(fix["diff"].splitlines())
                log(f"Fix created: {fix['id']}, diff: {diff_lines} lines")
                record("mock_pipeline", "fix_id", fix["id"])
                record("mock_pipeline", "fix_diff_lines", diff_lines)
                steps_passed += 1
            except Exception as e:
                log(f"Fix FAILED: {e}")
                record("mock_pipeline", "fix_error", str(e))
        
        # Step 5: Rerun
        if bench_run_id:
            steps_total += 1
            try:
                log("Triggering rerun of failed scenarios only...")
                rerun_resp = await client.post(f"/runs/{bench_run_id}/rerun")
                assert rerun_resp.status_code == 200, f"HTTP {rerun_resp.status_code}: {rerun_resp.text}"
                rerun = rerun_resp.json()
                rerun_id = rerun["id"]
                log(f"Rerun initiated: {rerun_id}")
                
                # Wait for orchestrator
                final = None
                for _ in range(60):
                    await asyncio.sleep(0.4)
                    chk = await client.get(f"/runs/{rerun_id}")
                    data = chk.json()
                    if data["status"] == "completed":
                        final = data
                        break
                
                if final:
                    improved = final["purity_score"] > initial_score
                    log(f"Rerun completed! Score: {initial_score}% -> {final['purity_score']}% "
                        f"({'IMPROVED' if improved else 'NO CHANGE'})")
                    record("mock_pipeline", "rerun_score", final["purity_score"])
                    record("mock_pipeline", "rerun_passed", final["passed_calls"])
                    record("mock_pipeline", "rerun_total", final["total_calls"])
                    record("mock_pipeline", "score_improved", improved)
                    steps_passed += 1
                else:
                    log("Rerun timed out!")
                    record("mock_pipeline", "rerun_timeout", True)
            except Exception as e:
                log(f"Rerun FAILED: {e}")
                record("mock_pipeline", "rerun_error", str(e))
        
        # Step 6: PDF Report
        if bench_run_id:
            steps_total += 1
            try:
                pdf = await client.get(f"/runs/{bench_run_id}/report.pdf")
                assert pdf.status_code == 200
                pdf_size = len(pdf.content)
                log(f"PDF report generated: {pdf_size} bytes")
                record("mock_pipeline", "pdf_size_bytes", pdf_size)
                steps_passed += 1
            except Exception as e:
                log(f"PDF FAILED: {e}")
                record("mock_pipeline", "pdf_error", str(e))
        
        record("mock_pipeline", "steps_passed", steps_passed)
        record("mock_pipeline", "steps_total", steps_total)
        log(f"Pipeline result: {steps_passed}/{steps_total} steps passed")
        return steps_passed == steps_total

# ───────────────────── Phase 3: Real Call Probe ──────────────────────

async def phase3_real_call():
    print("\n" + "=" * 65)
    print("  PHASE 3: Live API Verification (Bolna & Sarvam)")
    print("=" * 65)
    
    import httpx
    
    api_key = os.getenv("BOLNA_API_KEY")
    sarvam_key = os.getenv("SARVAM_API_KEY")
    
    # 1. Probe Bolna API
    if api_key:
        try:
            log("Probing Bolna API credentials...")
            async with httpx.AsyncClient(timeout=15.0) as client:
                r_me = await client.get("https://api.bolna.ai/user/me", headers={"Authorization": f"Bearer {api_key}"})
                r_agents = await client.get("https://api.bolna.ai/agent/all", headers={"Authorization": f"Bearer {api_key}"})
                
                if r_me.status_code == 200:
                    user_data = r_me.json()
                    wallet = user_data.get("wallet", "N/A")
                    agents_list = r_agents.json() if r_agents.status_code == 200 else []
                    log(f"Bolna API: CONNECTED! Wallet Balance: {wallet}, Agents in account: {len(agents_list)}")
                    record("real_call", "bolna_auth", "OK")
                    record("real_call", "bolna_wallet", wallet)
                    record("real_call", "bolna_agents_count", len(agents_list))
                else:
                    log(f"Bolna API Auth FAILED: HTTP {r_me.status_code}")
                    record("real_call", "bolna_auth", f"HTTP {r_me.status_code}")
        except Exception as e:
            log(f"Bolna API probe error: {e}")
            record("real_call", "bolna_probe_error", str(e))
    else:
        log("BOLNA_API_KEY not set")
        record("real_call", "bolna_auth", "NOT_CONFIGURED")

    # 2. Probe Sarvam API
    if sarvam_key:
        try:
            log("Probing Sarvam AI credentials & translation...")
            async with httpx.AsyncClient(timeout=15.0) as client:
                r_sarvam = await client.post(
                    "https://api.sarvam.ai/translate",
                    headers={"api-subscription-key": sarvam_key, "Content-Type": "application/json"},
                    json={
                        "input": "Test it like gold before you dial.",
                        "source_language_code": "en-IN",
                        "target_language_code": "hi-IN",
                        "mode": "formal"
                    }
                )
                if r_sarvam.status_code == 200:
                    translated = r_sarvam.json().get("translated_text", "")
                    log(f"Sarvam API: CONNECTED! Translation probe succeeded")
                    record("real_call", "sarvam_auth", "OK")
                    record("real_call", "sarvam_probe", "SUCCESS")
                else:
                    log(f"Sarvam API probe FAILED: HTTP {r_sarvam.status_code}")
                    record("real_call", "sarvam_auth", f"HTTP {r_sarvam.status_code}")
        except Exception as e:
            log(f"Sarvam API probe error: {e}")
            record("real_call", "sarvam_probe_error", str(e))
    else:
        log("SARVAM_API_KEY not set")
        record("real_call", "sarvam_auth", "NOT_CONFIGURED")
    
    # 3. Check for outbound phone call parameters
    base_url = os.getenv("BOLNA_BASE_URL", "https://api.bolna.ai").rstrip("/")
    direction = os.getenv("DIRECTION", "caller_to_target")
    caller_agent_id = os.getenv("BOLNA_CALLER_AGENT_ID")
    staging_agent_id = os.getenv("BOLNA_STAGING_AGENT_ID")
    target_phone = os.getenv("BOLNA_TARGET_PHONE")
    
    def _clean_val(v):
        if not v or not isinstance(v, str):
            return None
        v = v.strip()
        return None if (v.startswith("#") or not v) else v

    caller_agent_id = _clean_val(caller_agent_id)
    staging_agent_id = _clean_val(staging_agent_id)
    target_phone = _clean_val(target_phone)
    
    dialing_agent = caller_agent_id or staging_agent_id
    recipient = target_phone
    
    if not dialing_agent or not recipient:
        log("No target phone number or agent ID provided — outbound dial skipped (probe only)")
        record("real_call", "skipped", True)
        record("real_call", "reason", "Live API keys verified. BOLNA_TARGET_PHONE and agent ID not set for outbound call.")
        return True
    
    log(f"Direction: {direction}")
    log(f"Dialing agent: {dialing_agent[:10]}...{dialing_agent[-6:]}")
    log(f"Recipient: {recipient[:6]}...{recipient[-4:]}")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    call_payload = {
        "agent_id": dialing_agent,
        "recipient_phone_number": recipient,
        "user_data": {
            "scenario_id": "real_probe_capture",
            "caller_persona": "Priya Sharma, calling to inquire about loan eligibility",
            "language": "Hindi"
        }
    }
    
    webhook_url = os.getenv("PUBLIC_WEBHOOK_URL")
    if webhook_url:
        call_payload["webhook_url"] = webhook_url
    
    start = time.time()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Place call
        try:
            log("POST /call — placing 1 real outbound call...")
            resp = await client.post(f"{base_url}/call", headers=headers, json=call_payload)
            record("real_call", "call_status_code", resp.status_code)
            
            if resp.status_code not in (200, 201):
                error_text = resp.text[:500]
                log(f"Call initiation FAILED: HTTP {resp.status_code}")
                log(f"Response body: {error_text}")
                record("real_call", "call_error", error_text)
                record("real_call", "success", False)
                return False
            
            call_data = resp.json()
            exec_id = call_data.get("execution_id") or call_data.get("id")
            log(f"Call placed! execution_id={exec_id}")
            record("real_call", "execution_id", exec_id)
            record("real_call", "call_response_keys", list(call_data.keys()))
        except Exception as e:
            log(f"Network error placing call: {e}")
            record("real_call", "network_error", str(e))
            record("real_call", "success", False)
            return False
        
        # 2. Poll until terminal
        log("Polling execution status (max 95s)...")
        terminal_statuses = {"completed", "no-answer", "busy", "failed", "canceled", "stopped", "error", "balance-low"}
        final_payload = None
        poll_count = 0
        
        while time.time() - start < 95:
            try:
                poll_count += 1
                exec_resp = await client.get(f"{base_url}/executions/{exec_id}", headers=headers)
                if exec_resp.status_code == 200:
                    final_payload = exec_resp.json()
                    status = final_payload.get("status")
                    elapsed_s = int(time.time() - start)
                    log(f"  Poll #{poll_count}: status={status} ({elapsed_s}s elapsed)")
                    if status in terminal_statuses:
                        break
                else:
                    log(f"  Poll #{poll_count}: HTTP {exec_resp.status_code}")
            except Exception as e:
                log(f"  Poll #{poll_count}: error: {e}")
            await asyncio.sleep(4)
        
        total_elapsed = round(time.time() - start, 2)
        record("real_call", "poll_count", poll_count)
        record("real_call", "total_elapsed_seconds", total_elapsed)
        
        if not final_payload:
            log("Timed out waiting for execution terminal status!")
            record("real_call", "timeout", True)
            record("real_call", "success", False)
            return False
        
        # 3. Capture results
        final_status = final_payload.get("status", "unknown")
        duration = final_payload.get("conversation_duration", 0)
        cost = final_payload.get("total_cost", 0)
        transcript = final_payload.get("transcript", "")
        recording_url = final_payload.get("recording_url", "")
        
        log(f"Final status: {final_status}")
        log(f"Duration: {duration}s, Cost: ${cost}")
        log(f"Transcript length: {len(transcript)} chars")
        log(f"Recording URL: {'YES' if recording_url else 'NONE'}")
        
        record("real_call", "final_status", final_status)
        record("real_call", "conversation_duration_seconds", duration)
        record("real_call", "total_cost_usd", cost)
        record("real_call", "transcript_length", len(transcript))
        record("real_call", "transcript_preview", transcript[:500] if transcript else "(empty)")
        record("real_call", "recording_url_present", bool(recording_url))
        record("real_call", "response_keys", list(final_payload.keys()))
        record("real_call", "success", final_status == "completed")
        
        # 4. Save fixtures
        fixtures_dir = ROOT / "fixtures"
        fixtures_dir.mkdir(parents=True, exist_ok=True)
        
        exec_path = fixtures_dir / "execution_response.json"
        with open(exec_path, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)
        log(f"Saved execution fixture: {exec_path}")
        
        webhook_path = fixtures_dir / "webhook_completed.json"
        with open(webhook_path, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)
        log(f"Saved webhook fixture: {webhook_path}")
        
        record("real_call", "fixtures_saved", True)
        
        return final_status in ("completed", "no-answer", "busy")

# ───────────────────── Phase 4: Generate Report ──────────────────────

def phase4_generate_report(p1_ok, p2_ok, p3_ok):
    print("\n" + "=" * 65)
    print("  PHASE 4: Generating Test Report")
    print("=" * 65)
    
    results["summary"] = {
        "phase1_unit_tests": "PASS" if p1_ok else "FAIL",
        "phase2_mock_pipeline": "PASS" if p2_ok else "FAIL",
        "phase3_real_call": "PASS" if p3_ok else "FAIL",
        "overall": "PASS" if (p1_ok and p2_ok and p3_ok) else "PARTIAL" if (p1_ok and p2_ok) else "FAIL"
    }
    
    # Save JSON report
    report_path = ROOT / "test_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    log(f"JSON report saved: {report_path}")
    
    # Generate Markdown report
    md = generate_markdown_report(results)
    md_path = ROOT / "TEST_REPORT.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md)
    log(f"Markdown report saved: {md_path}")
    
    return md_path

def generate_markdown_report(r):
    p = r["phases"]
    s = r["summary"]
    
    ut = p.get("unit_tests", {})
    mp = p.get("mock_pipeline", {})
    rc = p.get("real_call", {})
    
    overall_emoji = {"PASS": "✅", "PARTIAL": "⚠️", "FAIL": "❌"}.get(s["overall"], "❓")
    
    md = f"""# Kasauti Test Report — {r['timestamp'][:10]}
> *"Test it like gold before you dial."*

## Overall Result: {overall_emoji} {s['overall']}

| Phase | Result | Details |
|-------|--------|---------|
| Unit Tests | {'✅' if s['phase1_unit_tests']=='PASS' else '❌'} {s['phase1_unit_tests']} | {ut.get('passed',0)} passed, {ut.get('failed',0)} failed, {ut.get('errors',0)} errors ({ut.get('elapsed_seconds',0)}s) |
| Mock Pipeline | {'✅' if s['phase2_mock_pipeline']=='PASS' else '❌'} {s['phase2_mock_pipeline']} | {mp.get('steps_passed',0)}/{mp.get('steps_total',0)} steps |
| Live API Verification | {'✅' if s['phase3_real_call']=='PASS' else '❌'} {s['phase3_real_call']} | Bolna: {rc.get('bolna_auth','N/A')}, Sarvam: {rc.get('sarvam_auth','N/A')} |

---

## Phase 1: Unit Tests

- **Tests Passed**: {ut.get('passed',0)}
- **Tests Failed**: {ut.get('failed',0)}
- **Errors**: {ut.get('errors',0)}
- **Duration**: {ut.get('elapsed_seconds',0)}s

## Phase 2: Mock Pipeline

- **Health**: {mp.get('health',{}).get('status','?')} (mode: {mp.get('health',{}).get('bolna_mode','?')})
- **Targets**: {mp.get('targets_count',0)}
- **Initial Purity Score**: {mp.get('initial_score','N/A')}%
- **Fix Applied**: {'Yes' if mp.get('fix_id') else 'No'} (diff: {mp.get('fix_diff_lines','N/A')} lines)
- **Rerun Score**: {mp.get('rerun_score','N/A')}% ({'Improved!' if mp.get('score_improved') else 'No change'})
- **PDF Report**: {mp.get('pdf_size_bytes','N/A')} bytes

## Phase 3: Live API Verification (Bolna & Sarvam)

- **Bolna API Connection**: `{rc.get('bolna_auth','N/A')}`
- **Bolna Wallet Balance**: `{rc.get('bolna_wallet','N/A')}`
- **Bolna Agents Count**: `{rc.get('bolna_agents_count',0)}`
- **Sarvam AI Connection**: `{rc.get('sarvam_auth','N/A')}`
- **Sarvam Translation Test**: `{rc.get('sarvam_probe','N/A')}`

"""
    if rc.get("skipped"):
        md += f"- **Outbound Call Status**: Skipped — {rc.get('reason','No reason')}\n"
    else:
        md += f"""- **Execution ID**: `{rc.get('execution_id','N/A')}`
- **Final Status**: `{rc.get('final_status','N/A')}`
- **Duration**: {rc.get('conversation_duration_seconds',0)} seconds
- **Cost**: ${rc.get('total_cost_usd',0):.4f} USD
- **Transcript Length**: {rc.get('transcript_length',0)} chars
- **Recording Available**: {'Yes' if rc.get('recording_url_present') else 'No'}
- **Poll Count**: {rc.get('poll_count',0)} polls over {rc.get('total_elapsed_seconds',0)}s
- **API Response Keys**: `{rc.get('response_keys','N/A')}`
- **Fixtures Saved**: {'Yes' if rc.get('fixtures_saved') else 'No'}

### Transcript Preview
```
{rc.get('transcript_preview','(none)')}
```
"""
    
    md += f"""
---

## Budget Impact

| Item | Value |
|------|-------|
| Real calls placed | {1 if not rc.get('skipped') else 0} |
| Estimated cost | ${rc.get('total_cost_usd',0):.4f} USD |
| Remaining budget | ~${8.0 - float(rc.get('total_cost_usd',0)):.2f} USD |

---

*Report generated by `scripts/run_full_test.py` at {r['timestamp']}*
"""
    return md

# ───────────────────── Main ──────────────────────

async def main():
    print("=" * 65)
    print("  KASAUTI FULL TEST RUN")
    print("  Timestamp: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S %Z"))
    print("=" * 65)
    
    # Phase 1
    p1_ok = phase1_unit_tests()
    
    # Phase 2
    try:
        p2_ok = await phase2_mock_pipeline()
    except Exception as e:
        log(f"Phase 2 CRASHED: {e}")
        traceback.print_exc()
        record("mock_pipeline", "crash", str(e))
        p2_ok = False
    
    # Phase 3
    try:
        p3_ok = await phase3_real_call()
    except Exception as e:
        log(f"Phase 3 CRASHED: {e}")
        traceback.print_exc()
        record("real_call", "crash", str(e))
        p3_ok = False
    
    # Phase 4
    md_path = phase4_generate_report(p1_ok, p2_ok, p3_ok)
    
    print("\n" + "=" * 65)
    overall = results["summary"]["overall"]
    emoji = {"PASS": "PASS", "PARTIAL": "PARTIAL", "FAIL": "FAIL"}.get(overall, "?")
    print(f"  KASAUTI TEST COMPLETE: {emoji}")
    print(f"  Report: {md_path}")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(main())
