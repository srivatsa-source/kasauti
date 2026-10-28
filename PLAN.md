# Kasauti — Implementation Plan (Upgrade Plan: Real Mode & Sarvam Integration)
> *"Test it like gold before you dial."*

## 1. Documentation Review & Conflict Analysis
We audited the official Bolna and Sarvam documentation:
- Bolna: [AGENTS.md](https://www.bolna.ai/docs/AGENTS.md), [mcp-tool-list.md](https://www.bolna.ai/docs/build-with-ai/mcp-tool-list.md), [batch-calling.md](https://www.bolna.ai/docs/outbound/batch-calling.md), [polling-call-status-webhooks.md](https://www.bolna.ai/docs/polling-call-status-webhooks.md), [calls/make.md](https://www.bolna.ai/docs/api-reference/calls/make.md)
- Sarvam: [docs.sarvam.ai/llms.txt](https://docs.sarvam.ai/llms.txt), [api-reference/authentication.md](https://docs.sarvam.ai/api-reference/authentication.md), [speech-to-text/transcribe.md](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe.md), [text/translate-text.md](https://docs.sarvam.ai/api-reference/text/translate-text.md), [pricing.md](https://docs.sarvam.ai/api/getting-started/pricing.md)

### Specific Findings from Documentation
1. **Inbound Phone Numbers for Bolna Agents**:
   - Bolna supports inbound numbers via `POST /inbound/setup` and `POST /inbound/agent` (setup inbound routing to an agent), as well as bringing SIP trunks with DID numbers (`PATCH /trunk/numbers/{number_id}`).
2. **Prompt Overrides / Passing Variables per Call in Bolna**:
   - `POST /call` takes a `user_data` JSON object whose keys map to template variables in the prompt (e.g. `{{persona}}`, `{{goal}}`, `{{customer_name}}`).
   - `agent_data` also allows overriding `language` (`hi`, `kn`, etc.) and `voice_id` per call.
   - For prompt updates on staging agents, Bolna uses `PATCH /v2/agent/{agent_id}` with `agent_prompts.task_1.system_prompt`.
3. **Pricing & Cost in Execution Data**:
   - Bolna: Returns `conversation_duration` (seconds), `total_cost` (USD), and `usage_breakdown` (synthesizer, transcriber, LLM tokens) on terminal status `completed`. Outbound calling is typically ~$0.05 to $0.08 per minute.
   - Sarvam: STT is ₹0.49/min (billed per second), Translation is ₹2.00/1K chars, Language Identification is ₹0.35/1K chars. A 45-second re-transcription costs ~₹0.37, easily fitting within the 100 credits balance.
4. **Sarvam Inside Bolna**:
   - Bolna natively integrates with Sarvam AI: Bolna agents can select Sarvam ASR (`saaras`) and Sarvam TTS (`bulbul:v3`, `bulbul:v4-flash`) directly inside the Bolna dashboard for Indian languages.
5. **Call Direction Support**:
   - Supported and configurable via `DIRECTION=caller_to_target|target_to_caller`:
     - `caller_to_target`: Bolna Caller Agent (`BOLNA_CALLER_AGENT_ID`) dials the target agent's phone number (`BOLNA_TARGET_PHONE`), passing the scenario persona in `user_data`.
     - `target_to_caller`: Bolna Target Agent (`BOLNA_TARGET_AGENT_ID`) dials the caller/tester number (`BOLNA_CALLER_PHONE`).
6. **Code Conflicts Identified & Resolutions**:
   - **Target Agent Protection**: Current `fixer.py` had a fallback to `target.bolna_agent_id` if `staging_agent_id` was unset. *Resolution:* Target protection guard must fail fast and refuse to patch if the agent ID matches the target production agent ID.
   - **Sarvam Auth**: Requires `api-subscription-key` header (returns HTTP 403 on invalid key, not 401).
   - **Sarvam STT**: Expects multipart form `file` and returns `transcript`, `language_code`, and `language_probability`.
   - **Bolna Webhook Allowlist**: Allows Bolna IPs (`13.203.39.153`, `13.126.9.249`, `13.202.133.53`) in real mode, bypassed in mock mode.

---

## 2. Working Assumptions
1. **Small Credit Budget Discipline**:
   - Bolna budget: $10 (~120 minutes of calling max). Default spend ceiling: `BUDGET_USD=8.00`, `MAX_CALLS_PER_RUN=3`, `MAX_CALL_SECONDS=60`.
   - Sarvam budget: 100 credits. Guarded by `SARVAM_MAX_REQUESTS=25`. Re-transcription runs only on failed/flagged calls.
   - Pre-flight estimation displayed before any real execution with explicit confirmation required.
2. **Staging Isolation**:
   - Fix loop modifies STAGING agent only. A hard barrier prevents modifying the production target agent.
3. **Honesty Badging**:
   - Every run and call is explicitly badged as `REAL`, `MOCK`, or `REPLAY`.
   - Replay feature enables zero-cost presentation using recorded real calls.
4. **No Secret Leaks**:
   - Zero secrets logged, committed, or echoed in the chat or terminal.

---

## 3. Real Mode Milestones (R1 to R5)

### Milestone R1: Real Bolna Mode & Staging Guard
- Finalize `RealBolnaClient` with `POST /call`, webhook processing, 90s polling fallback, and terminal status handling (`completed`).
- Environment variables: `BOLNA_MODE=mock|real`, `BOLNA_API_KEY`, `BOLNA_TARGET_AGENT_ID`, `BOLNA_STAGING_AGENT_ID`, `BOLNA_CALLER_AGENT_ID`, `BOLNA_TARGET_PHONE`, `PUBLIC_WEBHOOK_URL`, `DIRECTION`.
- Target Agent Protection: Add strict guard in `RealBolnaClient.update_staging_agent` and `PromptFixer` preventing patches to `BOLNA_TARGET_AGENT_ID`. Add unit test in `tests/test_safety.py`.
- Run `scripts/capture_fixtures.py` for one real call, save payloads into `fixtures/`, verify contract tests.

### Milestone R2: Budget Guard & Cost Ledger
- Database cost ledger table: `cost_ledger(id, run_id, call_id, provider, cost_usd, is_estimated, timestamp)`.
- Pre-flight budget estimation: Calculate expected cost (calls × duration × rate), show in UI/CLI, require explicit confirmation before execution.
- Hard stop: Abort and refuse to dial if ledger total spend reaches `BUDGET_USD`.
- UI: Live "Spent / Remaining" budget badge in the header.

### Milestone R3: Sarvam Integration
- Build `SarvamClient` interface with `MockSarvamClient` and `RealSarvamClient` (`SARVAM_MODE=mock|real`), guarded by `SARVAM_MAX_REQUESTS`.
- Feature 1: Speech-to-text second opinion on call recordings with language detection (using `saaras:v4`), comparing against Bolna transcript on failed/flagged calls.
- Feature 2: Scenario variant generation script (`scripts/generate_scenario_variants.py`) using Sarvam Translation (`POST /translate`) with `output_script="roman"` to generate authentic Hindi, Kannada, and Hinglish variants.
- Feature 3: `docs/SARVAM.md` documenting how to select Sarvam ASR and TTS inside Bolna dashboard agents.

### Milestone R4: Honesty, Badges, Replay & Scenarios
- Run & Call Badges: `REAL`, `MOCK`, `REPLAY` badging across UI and PDF report.
- Replay Mode: Replay previously recorded real runs from database without network calls.
- Language Handling Check: Deterministic detector checking if agent maintained caller's language or switched incorrectly.
- Expand scenarios to 20 total in `scenarios/scenarios.jsonl` (adding language mid-sentence switch, aggressive interruptions, KYC extraction probes).
- PDF Report update: Include REAL/MOCK/REPLAY badge, cost breakdown, unverified rule badges, legal disclaimer.

### Milestone R5: Packaging & Submission Polish
- README update: <10 min mock mode setup, complete Real Mode guide with exact environment variable requirements.
- Deployment Guide (`docs/DEPLOYMENT.md`): Railway / Fly.io / Cloudflared tunnel setup for receiving real webhooks.
- Demo Script (`scripts/demo.md`): Structured 3-minute hackathon walkthrough for recording the demo video.
- Public repo hygiene: Secret scanning, `.env.example` validation, MIT `LICENSE`.
