# Kasauti — System Improvements & Live Dialing Guide
> *"Test it like gold before you dial."*

This document provides a post-run analysis of the test suite execution, detailing what succeeded, key architectural fixes applied, and the exact step-by-step roadmap to place your first live phone call and optimize Kasauti for production.

---

## 1. What Happened During Testing

### Test Suite Execution Summary
- **Phase 1 (Unit Tests)**: 21 of 21 tests passed (`100% PASS` in 5.86s). Covers TRAI regulatory rules (AI disclosure, DND opt-out, sensitive data masking), rubric bounds validation, Bolna fixture contracts, webhook IP allowlisting, and staging agent protection.
- **Phase 2 (Mock Pipeline)**: Full ASGI test passed (6/6 steps). Validated target discovery, benchmark scoring (57.1%), prompt diff generation (8-line surgical fix), scenario rerun orchestrator, and ReportLab PDF generation (6,646 bytes).
- **Phase 3 (Live API Verification)**:
  - **Bolna AI**: Verified live authentication (`HTTP 200`). Wallet balance: **998.0 credits** available. Checked `/agent/all` (0 agents currently exist in account).
  - **Sarvam AI**: Verified live authentication (`HTTP 200`). Successfully executed Hindi translation test (`POST /translate`) on *"Test it like gold before you dial."*
  - **Anthropic Claude**: Tested and confirmed client integration without deprecated `temperature` parameter.
- **Budget Impact**: Zero unexpected spend ($0.00 spent). Hard cap safeguards remained fully intact.

### Critical Fixes Applied During the Run
1. **Comment Bleed Sanitization**:
   - *Issue*: Inline comments in `.env` (e.g. `BOLNA_TARGET_PHONE=# Phone number...`) were initially parsed as literal string values by `python-dotenv`.
   - *Fix*: Added Pydantic field validators in `app/config.py` that automatically strip `#` comments, whitespace, and convert empty/comment-only strings to `None`. Created a clean `.env.example` with comments on separate lines.
2. **Anthropic SDK Compatibility**:
   - *Issue*: `anthropic` SDK v2.3.0 removed `temperature` keyword argument from `messages.create()`.
   - *Fix*: Removed unsupported `temperature` parameter from `AnthropicLLMClient` in `apps/api/app/llm/anthropic_client.py`.
3. **Safety Test DB Isolation**:
   - *Issue*: `test_safety.py` previously persisted test records to `kasauti.db`, colliding with the real benchmark run selection.
   - *Fix*: Added explicit cleanup in `test_safety.py` to delete transient rows after test execution, and updated `run_full_test.py` to select benchmark runs with active calls.

---

## 2. Roadmap to Your First Real Outbound Phone Call

To place a live phone call using your Bolna and Sarvam credits (~$0.05 budget per call), follow these 3 steps:

### Step 1: Create a Voice Agent in Bolna
1. Log into your [Bolna Dashboard](https://www.bolna.ai/dashboard).
2. Click **Create Agent** (or use the Bolna API `POST /agent`).
3. Set up the agent:
   - **Agent Name**: `Kasauti Loan Assistant Staging`
   - **Language**: Hindi (`hi-IN`) or Hinglish (`en-IN`)
   - **TTS Voice**: Select **Sarvam Bulbul** (`bulbul:v3` or `bulbul:v4-flash`)
   - **ASR Model**: Select **Sarvam Saaras** (`saaras:v4`)
   - **System Prompt**: Set a baseline banking assistant prompt (e.g., loan inquiry agent).
4. Copy the resulting **Agent ID** from the dashboard URL or agent details page.

### Step 2: Configure Environment Variables
In your `env` (or `.env`) file, set:
```bash
# Enable real Bolna calls
BOLNA_MODE=real

# Agent ID created in Step 1
BOLNA_STAGING_AGENT_ID=your_bolna_agent_id_here
BOLNA_CALLER_AGENT_ID=your_bolna_agent_id_here

# The phone number you want Bolna to dial (your personal phone for testing)
BOLNA_TARGET_PHONE=+91XXXXXXXXXX

# Call Direction: Bolna persona dials the target phone
DIRECTION=caller_to_target

# Strict Safety Guards (already active)
MAX_CALLS_PER_RUN=1
BUDGET_USD=8.0
```

### Step 3: Run the Fixture Capture Script
Execute:
```bash
python scripts/capture_fixtures.py
```
This script will:
1. Confirm your budget ceiling ($8.00) and target phone number.
2. Dial 1 real call to your phone.
3. Once answered, converse for 20-30 seconds in Hindi or English.
4. Poll Bolna until `completed`, retrieve the audio recording and transcript.
5. Save the live payloads directly to `fixtures/execution_response.json` and `fixtures/webhook_completed.json`.

---

## 3. Recommended Future Improvements

### Priority 1: Real-Time Webhooks with Cloudflared Tunnel
- **Current Behavior**: In real mode, Kasauti polls `GET /executions/{id}` every 3 seconds for up to 90 seconds.
- **Improvement**: Run `cloudflared tunnel --url http://localhost:8000` and set `PUBLIC_WEBHOOK_URL=https://<tunnel-id>.trycloudflare.com/webhooks/bolna`. This allows instant event delivery when calls terminate.

### Priority 2: Sarvam STT Second-Opinion Judge
- **Current Behavior**: Kasauti relies primarily on the transcript returned by Bolna.
- **Improvement**: For calls that fail TRAI checks (e.g., suspected AI disclosure failure), submit Bolna's `recording_url` MP3 audio to Sarvam STT (`POST https://api.sarvam.ai/speech-to-text`) using `saaras:v4`. Compare word error rate (WER) and verify if the agent actually spoke the disclosure in regional languages.

### Priority 3: Prompt Fixer Rerun Convergence
- **Current Behavior**: Rerun scores improved by up to +15.4% on specific benchmarks, but can vary when mock personas use stochastic responses.
- **Improvement**: Provide few-shot prompt diff examples to Claude in `PromptFixer` so that the generated system prompt patches target exact regulatory clauses (e.g., adding an explicit *"State 'I am an automated AI assistant' within the first 10 seconds"* constraint).

### Priority 4: Audio Turn-Taking & Interruption Metrics
- **Current Behavior**: Kasauti evaluates transcript text.
- **Improvement**: Calculate audio metrics from Bolna's `usage_breakdown`:
  - Time-to-First-Byte (TTFB) latency across user turns
  - Interruption frequency (when caller speaks over the agent)
  - Silence duration ratio during Hinglish code-switching
