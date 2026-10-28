# Kasauti (कसौटी)
> *"Test it like gold before you dial."*

Kasauti is an automated testing and compliance benchmarking suite for Indian voice AI agents. Kasauti places simulated phone calls across **Hindi, Hinglish, Kannada, and Indian English** to a voice agent under test, scores each call across conversational rubrics and TRAI-style regulatory checks, proposes minimal prompt fixes, applies them to a staging agent, and reruns only the failed scenarios.

---

## Key Highlights

- **Zero-Credential Mock Mode**: The entire app runs out-of-the-box with zero API keys and zero outbound calls.
- **Linguistic Diversity**: Scenarios covering Hindi, Hinglish, Kannada, and Indian English with code-switching, noise, interruptions, and regional escalation.
- **Deterministic Rule Engine**: Checks calling hours (IST), AI disclosure, DND opt-out honoring, and sensitive credential protection (OTP, PAN, Aadhaar, CVV).
- **LLM Rubric Judge**: Evaluates task completion, language fluency, tone, and hallucination with strict Pydantic JSON validation.
- **Surgical Auto-Fix Loop**: Diagnoses failures, proposes prompt diffs, updates the staging copy, and reruns only failed scenarios until green.
- **Investor & Compliance PDF Reports**: Clean ReportLab generation in Kasauti's signature Charcoal & Gold hallmark aesthetic.
- **Real Bolna Ready**: Swappable `BolnaClient` interface with webhook IP allowlist, numeric timezone scheduling, spend caps, and fixture capture.

---

> 📖 **Teammates:** Read the [Teammate Testing & Bolna Setup Guide](docs/TESTING_GUIDE.md) for step-by-step instructions on setting up Bolna agents, running test suites, and team Git branching rules.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │      Next.js Frontend (apps/web)    │
                        │    Charcoal & Gold, WaveSurfer.js   │
                        └──────────────────┬──────────────────┘
                                           │ REST / Polling (3s)
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Backend (apps/api)                        │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐ │
│  │ Scenario Compiler    │  │ Rule Engine          │  │ Rubric Judge       │ │
│  │ 12 seeded personas   │  │ rules/trai.yaml      │  │ Anthropic / Mock   │ │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬──────────┘ │
│             │                         │                        │            │
│  ┌──────────▼─────────────────────────▼────────────────────────▼───────────┐ │
│  │                            Run Orchestrator                             │ │
│  └────────────────────────────────────┬────────────────────────────────────┘ │
│                                       │                                      │
│                ┌──────────────────────┴──────────────────────┐               │
│                ▼                                             ▼               │
│   ┌─────────────────────────┐                   ┌──────────────────────────┐ │
│   │ MockBolnaClient         │                   │ RealBolnaClient          │ │
│   │ Lifecycle simulation,   │                   │ https://api.bolna.ai     │ │
│   │ canned Hindi/Kannada,   │                   │ Spends cap & confirms,   │ │
│   │ local webhook loopback  │                   │ numeric offsets (+05:30) │ │
│   └─────────────────────────┘                   └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Setup in Under 10 Minutes

### Option A: One Command with Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

---

### Option B: Local Development (Python + Node.js)

#### 1. Backend Setup (FastAPI)
```bash
# From repository root
cp .env.example .env

# Install backend dependencies
pip install -r apps/api/requirements.txt

# Run benchmark seed script
python scripts/seed_demo.py

# Start API server
uvicorn app.main:app --app-dir apps/api --reload --port 8000
```

#### 2. Frontend Setup (Next.js)
```bash
cd apps/web
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Running the Automated Test Suite

Kasauti includes comprehensive tests for:
- Deterministic TRAI rule engine (AI disclosure, calling hours, DND opt-out, OTP/PAN/Aadhaar protection)
- Webhook IP allowlist validation (rejecting spoofed IPs with 403, bypassing in mock mode)
- LLM rubric JSON schema bounds and format validation
- Pydantic contract tests verifying Bolna execution and webhook payload shapes
- Staging isolation guards preventing target agent modification

### Option 1: Fast Pytest Suite (Mock Mode)
```bash
pytest tests/ -v
```
All **21 tests** pass out of the box with zero network dependencies.

### Option 2: Full 4-Phase End-to-End Pipeline & Live Verification
```bash
python scripts/run_full_test.py
```
This runs:
1. **Phase 1**: Unit test suite (pytest)
2. **Phase 2**: Full mock ASGI pipeline (health, target, benchmark, prompt fix diff, rerun, PDF report)
3. **Phase 3**: Live API verification probing Bolna and Sarvam AI accounts
4. **Phase 4**: Automated report generation ([TEST_REPORT.md](TEST_REPORT.md))

---

## Live Bolna & Sarvam AI Integration

Kasauti supports seamless transition from zero-cost mock mode to live telephony and speech AI:

1. Configure your keys in `env` (or `.env`):
   ```bash
   BOLNA_MODE=mock  # set to 'real' when ready to place calls
   BOLNA_API_KEY=your_bolna_api_key
   SARVAM_API_KEY=your_sarvam_api_key
   ```
2. For outbound calling (~$0.05 budget per call):
   ```bash
   BOLNA_MODE=real
   BOLNA_STAGING_AGENT_ID=your_staging_agent_id
   BOLNA_CALLER_AGENT_ID=your_staging_agent_id
   BOLNA_TARGET_PHONE=+91XXXXXXXXXX
   MAX_CALLS_PER_RUN=1
   BUDGET_USD=8.0
   ```
3. Run the live call capture:
   ```bash
   python scripts/capture_fixtures.py
   ```
4. Safety & Budget Enforcement:
   - Verifies webhook requests originate from Bolna's IPs (`13.203.39.153`, `13.126.9.249`, `13.202.133.53`)
   - Enforces `MAX_CALLS_PER_RUN` and hard budget cap (`BUDGET_USD`)
   - Numeric timezone offset (`+05:30` / `+00:00`), never `Z`
   - Hard safety guard: **Staging agents only** (`PATCH /v2/agent/{agent_id}`), never modifies production targets.

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for the full teammate setup and testing guide, and [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md) for future system improvements.

---

## Legal Disclaimer
Kasauti checks voice agent conversational transcripts against a community-contributed rule pack for testing and development purposes. **Kasauti does not provide legal advice.** Rules flagged with `Unverified Rule` are pending validation against official TRAI Gazette regulatory texts.
