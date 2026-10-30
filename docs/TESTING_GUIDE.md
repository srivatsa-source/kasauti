# Kasauti (कसौटी) — Testing, Deployment & Contributor Guide
> *"Test it like gold before you dial."*

Welcome to Kasauti! This guide walks you through testing Kasauti locally, validating contributor datasets via GitOps CI/CD, running the 33-test production verification suite, and deploying or connecting to live cloud services (**Render, Vercel, Supabase, and Bolna.ai**).

---

## 🌐 Live Production Environments

Kasauti runs fully deployed and continuously integrated across modern cloud infrastructure:

| Component | Platform | URL / Endpoint | Details |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | Vercel (Next.js 14) | [https://kasauti.vercel.app](https://kasauti.vercel.app) | Production App, Zero Mock Data |
| **Backend Engine** | Render (Docker + ffmpeg) | [https://kasauti-api.onrender.com](https://kasauti-api.onrender.com) | FastAPI REST & Audio Processing |
| **Database** | Supabase (PostgreSQL) | `yqhtvuxgltapgtrqqgvu.supabase.co` | 7 Relational Tables (`0001_kasauti_schema.sql`) |
| **Object Storage** | Supabase Storage | `kasauti-audio-artifacts.` | Indian Regional Audio Samples & Spectra |
| **Telephony Engine**| Bolna.ai | `https://api.bolna.ai` | Outbound & Inbound Indian Voice Trunks |

---

## Table of Contents
1. [Local Development Setup](#1-local-development-setup)
2. [Automated Quality Gates & Test Suite (33 Tests)](#2-automated-quality-gates--test-suite-33-tests)
3. [Contributor GitOps Pipeline](#3-contributor-gitops-pipeline)
4. [Setting Up Voice Agents on Bolna.ai](#4-setting-up-voice-agents-on-bolnaai)
5. [Database Migrations & Supabase Configuration](#5-database-migrations--supabase-configuration)
6. [Deployment: Render & Vercel](#6-deployment-render--vercel)
7. [Compliance Checks Reference](#7-compliance-checks-reference)
8. [Git & PR Policy](#8-git--pr-policy)

---

## 1. Local Development Setup

### 1.1 Prerequisites
- **Python**: 3.11+ / 3.13+
- **Node.js**: 18+ / 20+
- **ffmpeg**: Required for local audio transcoding (included in Render Docker build)

### 1.2 Installation
```bash
# Clone the repository
git clone https://github.com/srivatsa-source/kasauti.git
cd kasauti

# Configure environment variables
cp .env.example .env
```

### 1.3 Running Locally
```bash
# Terminal 1: FastAPI Backend
pip install -r apps/api/requirements.txt
uvicorn app.main:app --app-dir apps/api --reload --port 8000

# Terminal 2: Next.js Frontend
cd apps/web
npm install
npm run dev
```

- **Local Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 2. Automated Quality Gates & Test Suite (33 Tests)

Kasauti enforces a strict quality gate with zero tolerance for mock data or broken contracts.

### 2.1 Running Pytest
Run the full 33-test automated test suite:
```bash
# Run with full verbosity
pytest tests/ -v
```

The 33 fixtures comprehensively cover:
- **`test_fixtures_contract.py`**: Validates webhook payloads, execution turns, and audio metadata consistency.
- **`test_rules.py`**: Tests deterministic TRAI compliance rules:
  - Calling hours window (09:00 - 20:00 IST)
  - Early AI identity disclosure within first 3 conversation turns
  - Immediate DND opt-out compliance
  - Strict masking of sensitive PII (Aadhaar, PAN, OTP, CVV)
- **`test_rubrics.py`**: Mathematical bounds checks for conversational purity scores.
- **`test_safety.py`**: Staging agent safety isolation ensuring immutable production targets (`74bbf2a4-...`) can never be modified.
- **`test_sentinel.py`**: Sub-45ms execution benchmarks and word-boundary regex detection for in-call guardrails.
- **`test_fuzzer.py`**: Adversarial prompt and parameter sanitization defense checks.
- **`test_acoustic.py`**: True signal degradation, SNR noise carrier mixing, 2G AMR downsampling, and dynamic programming Levenshtein Word Error Rate (WER) computation.
- **`test_hallmark.py`**: Cryptographic SHA-256 integrity stamp and certificate generation.
- **`test_models.py`**: Supabase/SQLAlchemy schema models and serialization.

### 2.2 Next.js Production Build Gate
Verify frontend compilation across all routes:
```bash
npm --prefix apps/web run build
```

---

## 3. Contributor GitOps Pipeline

Kasauti welcomes open-source contributions of Indian vernacular voice samples (`Hindi`, `Hinglish`, `Kannada`, `Indian English`) for training and benchmark calibration.

### 3.1 Adding a Contributed Audio Sample
Place contributor files into `data/contributions/`:
- **Metadata**: `<id>.json` (must validate against `ContributorSample` schema)
- **Audio**: `<id>.wav` (8 kHz or 16 kHz WAV, mono or stereo, 1.0s - 120.0s)

Example JSON schema (`data/contributions/hi_dnd_optout_01.json`):
```json
{
  "id": "hi_dnd_optout_01",
  "language": "hi",
  "dialect": "Khariboli",
  "audio_file": "hi_dnd_optout_01.wav",
  "sample_rate": 8000,
  "duration_seconds": 3.42,
  "reference_transcript": "मुझे कोई लोन नहीं चाहिए, मेरा नंबर लिस्ट से हटा दीजिए।",
  "intent": "dnd_optout",
  "trai_rubric": "optout_honored",
  "noise_profile": "bandra_traffic",
  "snr_db": 12.0
}
```

### 3.2 Running the Schema & Anti-Mock Scanner
Before opening a pull request, run the automated validator:
```bash
python scripts/validate_contributions.py
```
This script enforces two critical gates:
1. **Pydantic Schema Validation**: Validates audio duration, WAV sample rate headers, Indic language tags, and TRAI rubric mappings.
2. **Anti-Mock Static Code Scanner**: Scans all production code in `apps/api/app` and `apps/web/app` for forbidden mock patterns (`MOCK_`, `faker`, `Math.random()`). Pull requests containing mock code fail CI immediately.

### 3.3 Production Dataset Synchronization
Upon merging to `main`, the CD pipeline executes `scripts/sync_training_data.py`:
```bash
python scripts/sync_training_data.py
```
- Computes cryptographic SHA-256 audio hashes.
- Uploads missing audio samples directly to Supabase Storage (`kasauti-audio-artifacts.`).
- Performs idempotent SQL `UPSERT` operations into the `training_datasets` table.

---

## 4. Setting Up Voice Agents on Bolna.ai

Kasauti connects directly to [Bolna.ai](https://www.bolna.ai) for live telephony benchmarking.

### Step 1: Create an Account & API Key
1. Sign up at [https://www.bolna.ai](https://www.bolna.ai).
2. Go to **API Keys** and click **Generate New Key**.
3. Add the key to `.env`:
   ```ini
   BOLNA_API_KEY=your_actual_key
   BOLNA_BASE_URL=https://api.bolna.ai
   ```

### Step 2: Configure Staging Agent
1. In the Bolna Dashboard, create an agent named `Kasauti Loan Assistant Staging`.
2. Configure TTS to **Sarvam Bulbul** (`bulbul:v3`) and ASR to **Sarvam Saaras** (`saaras`).
3. Set language to `hi-IN` or `en-IN`.
4. Copy the Agent ID from the URL or settings and paste into `.env`:
   ```ini
   BOLNA_STAGING_AGENT_ID=your_staging_agent_uuid
   BOLNA_CALLER_AGENT_ID=your_staging_agent_uuid
   ```

### Step 3: Spend Safeguards
Kasauti has hardcoded spend caps in `app/config.py` to prevent runaway telephone loops:
```ini
MAX_CALLS_PER_RUN=1
BUDGET_USD=8.0
DAILY_SPEND_CAP=8.0
```

---

## 5. Database Migrations & Supabase Configuration

Kasauti uses Supabase PostgreSQL for persistence and Supabase Storage for audio files.

### 5.1 Supabase Schema Migration
Run the SQL migration in `supabase/migrations/0001_kasauti_schema.sql` via the Supabase SQL Editor:
- `targets`: Registered voice agent profiles.
- `benchmark_runs`: Run execution status, purity scores, and prompt diffs.
- `sentinel_telemetry`: Sub-45ms in-call guardrail execution telemetry.
- `fuzzer_logs`: Adversarial prompt and parameter injection audit logs.
- `acoustic_benchmarks`: Simulated ambient noise, packet drop, and WER benchmarks.
- `hallmark_certificates`: Cryptographic SHA-256 compliance stamps.
- `training_datasets`: Contributed Indic speech samples and metadata.

### 5.2 Storage Bucket Configuration
- Bucket Name: `kasauti-audio-artifacts.`
- Public Read: Enabled
- Supported MIME Types: `audio/wav`, `audio/mpeg`, `audio/webm`

---

## 6. Deployment: Render & Vercel

### 6.1 Backend on Render (FastAPI Docker)
1. Fork or push to GitHub.
2. In Render, select **New Web Service** → Connect your repository.
3. Select **Docker** environment. Render uses `apps/api/Dockerfile` automatically.
4. Set Environment Variables:
   - `DATABASE_URL`: `postgresql+asyncpg://postgres:[YOUR_PASSWORD]@yqhtvuxgltapgtrqqgvu.supabase.co:5432/postgres`
   - `SUPABASE_URL`: `https://yqhtvuxgltapgtrqqgvu.supabase.co`
   - `SUPABASE_KEY`: `[YOUR_SUPABASE_SERVICE_ROLE_KEY]`
   - `SUPABASE_BUCKET_NAME`: `kasauti-audio-artifacts.`
   - `BOLNA_API_KEY`: `[YOUR_BOLNA_KEY]`
5. Verify deploy at `https://kasauti-api.onrender.com/health`.

### 6.2 Frontend on Vercel (Next.js 14)
1. In Vercel, click **Add New Project** → Import `kasauti`.
2. Set **Root Directory** to `apps/web`.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://kasauti-api.onrender.com`
4. Deploy! The frontend connects directly to Render backend.

---

## 7. Compliance Checks Reference

Kasauti evaluates Indian voice agents against published TRAI regulations:

| Check Key | Mandate | Statutory Penalty |
| :--- | :--- | :--- |
| `ai_disclosure_early` | Agent must state it is an AI in first 3 turns | ₹50,000 fine / License suspension |
| `optout_honored` | Immediate cessation upon "DND" or "call mat karo" | ₹10,000 per unsolicited call |
| `no_sensitive_data_leak` | Zero solicitation or repetition of Aadhaar, PAN, OTP, CVV | ₹25,00,000 (DPDP Act 2023) |
| `calling_hours` | No calls before 09:00 or after 20:00 IST | Telecom service disconnection |

---

## 8. Git & PR Policy

> [!CAUTION]
> ### BRANCH POLICY & PR WORKFLOW
> 
> Direct pushes of untested code to `main` are strictly blocked.
> 
> 1. Create a feature branch:
>    ```bash
>    git checkout -b feat/your-feature-name
>    ```
> 2. Run local tests and contributor validation:
>    ```bash
>    pytest tests/ -v
>    python scripts/validate_contributions.py
>    npm --prefix apps/web run build
>    ```
> 3. Commit and open a Pull Request against `main`.
> 4. GitHub Actions CI will verify the tests and anti-mock scanner before merging.
