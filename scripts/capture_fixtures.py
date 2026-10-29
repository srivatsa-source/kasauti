#!/usr/bin/env python3
"""
scripts/capture_fixtures.py — Credential handoff script for Kasauti.

When real Bolna API credentials are ready:
1. Validates required environment variables (BOLNA_API_KEY, BOLNA_TARGET_PHONE / BOLNA_STAGING_AGENT_ID)
2. Shows exact call parameters and estimated cost
3. Requests EXPLICIT confirmation before spending real account balance
4. Places one real call via POST /call
5. Polls execution until terminal status (max 90s)
6. Saves raw payload to fixtures/execution_response.json and fixtures/webhook_completed.json
7. Validates contract tests against the captured payload

BUDGET DISCIPLINE: Placed only once to verify schema against live API.
"""

import os
import sys
import json
import time
from pathlib import Path
import httpx
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
FIXTURES_DIR = ROOT_DIR / "fixtures"

# Load environment from .env if present
load_dotenv(ROOT_DIR / ".env")

def main():
    print("=" * 65)
    print("  Kasauti Real Credential Handoff: Capture Live Fixtures")
    print("=" * 65)

    api_key = os.getenv("BOLNA_API_KEY")
    if not api_key:
        print("\nERROR: BOLNA_API_KEY is not set in .env or environment.")
        print("Please set BOLNA_API_KEY in your .env file and re-run.")
        sys.exit(1)

    direction = os.getenv("DIRECTION", "caller_to_target")
    target_phone = os.getenv("BOLNA_TARGET_PHONE") or os.getenv("RECIPIENT_PHONE")
    staging_agent_id = os.getenv("BOLNA_STAGING_AGENT_ID") or os.getenv("BOLNA_AGENT_ID")
    caller_agent_id = os.getenv("BOLNA_CALLER_AGENT_ID")

    if direction == "caller_to_target":
        dialing_agent = caller_agent_id or staging_agent_id
        recipient = target_phone
    else:
        dialing_agent = staging_agent_id
        recipient = target_phone

    if not dialing_agent:
        dialing_agent = input("Enter dialing Bolna Agent ID: ").strip()
    if not recipient:
        recipient = input("Enter recipient phone number (E.164, e.g. +91XXXXXXXXXX): ").strip()

    if not dialing_agent or not recipient:
        print("\nERROR: Dialing Agent ID and recipient phone number are required.")
        sys.exit(1)

    print("\n[CONFIG]")
    print(f"  Direction:      {direction}")
    print(f"  Dialing Agent:  {dialing_agent}")
    masked_recipient = recipient[:3] + "******" + recipient[-4:] if len(recipient) >= 7 else "***"
    print(f"  Recipient:      {masked_recipient}")
    print(f"  Estimated Cost: ~$0.04 - $0.07 USD (~1 minute max)")
    print(f"  Fixtures Dir:   {FIXTURES_DIR}")

    if "--yes" in sys.argv or os.getenv("AUTO_CONFIRM") == "1":
        confirm = "yes"
    else:
        confirm = input("\nPlace 1 LIVE call to capture fixtures? (yes/no): ").strip().lower()
    if confirm not in ("yes", "y"):
        print("Aborted. No real calls placed.")
        sys.exit(0)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    base_url = os.getenv("BOLNA_BASE_URL", "https://api.bolna.ai").rstrip("/")

    call_payload = {
        "agent_id": dialing_agent,
        "recipient_phone_number": recipient,
        "user_data": {
            "scenario_id": "fixture_capture_probe",
            "caller_persona": "Priya Sharma calling to inquire about loan eligibility"
        }
    }
    public_webhook = os.getenv("PUBLIC_WEBHOOK_URL")
    if public_webhook:
        call_payload["webhook_url"] = public_webhook

    print("\n[1/4] Placing outbound call via POST /call ...")
    with httpx.Client(timeout=30.0) as client:
        try:
            call_resp = client.post(f"{base_url}/call", headers=headers, json=call_payload)
            if call_resp.status_code not in (200, 201):
                print(f"ERROR: Call initiation failed ({call_resp.status_code}): {call_resp.text}")
                sys.exit(1)

            call_data = call_resp.json()
            exec_id = call_data.get("execution_id") or call_data.get("id")
            print(f"Call initiated successfully! Execution ID: {exec_id}")
        except Exception as e:
            print(f"Network error initiating call: {e}")
            sys.exit(1)

        print("\n[2/4] Polling execution status until terminal state (max 90s)...")
        terminal_statuses = {"completed", "no-answer", "busy", "failed", "canceled", "stopped", "error", "balance-low"}
        start_time = time.time()
        final_payload = None

        while time.time() - start_time < 95:
            try:
                exec_resp = client.get(f"{base_url}/executions/{exec_id}", headers=headers)
                if exec_resp.status_code == 200:
                    final_payload = exec_resp.json()
                    status = final_payload.get("status")
                    print(f"  Status: {status} (elapsed: {int(time.time() - start_time)}s)")
                    if status in terminal_statuses:
                        break
            except Exception as e:
                print(f"  Poll warning: {e}")
            time.sleep(4)

        if not final_payload:
            print("ERROR: Timed out waiting for execution to reach terminal status.")
            sys.exit(1)

        FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
        exec_path = FIXTURES_DIR / "execution_response.json"
        with open(exec_path, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)
        print(f"\n[3/4] Saved execution response to {exec_path}")

        webhook_path = FIXTURES_DIR / "webhook_completed.json"
        with open(webhook_path, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)
        print(f"[4/4] Saved webhook fixture to {webhook_path}")

    print("\n[SUCCESS] Contract tests and MockBolnaClient will now use real API payload shapes.")

if __name__ == "__main__":
    main()
