# Kasauti (कसौटी) — Architectural Improvements & Production Refactor
> *"Test it like gold before you dial."*

This document outlines the four-part enterprise production refactor completed on Kasauti, replacing initial prototype heuristics with true signal processing, continuous integration gates, managed cloud persistence, and high-performance serverless deployment.

---

## 1. Executive Summary of Improvements

| Module | Prototype State | Production State |
| :--- | :--- | :--- |
| **Persistence & Audio** | Transient SQLite / Local files | **Supabase PostgreSQL (7 tables)** + **Supabase Object Storage** (`kasauti-audio-artifacts.`) |
| **Data Integrity** | Static heuristic responses & mock objects | **Zero Mock Patterns Gate**; live Bolna telemetry ingestion; dynamic telemetry aggregation |
| **Acoustic Simulation** | String manipulation heuristics | **Mathematical Carrier Formants (`scipy.signal`)**, SNR ambient mixing, 2G AMR 8kHz downsampling with packet loss, dynamic programming Levenshtein WER |
| **In-Call Guardrail** | Conceptual latency timer | **Sub-45ms Real Sentinel Engine (`time.perf_counter_ns()`)**, word-boundary regex detection, real-time telemetry logging |
| **Adversarial Fuzzer** | Static list | **Dynamic Tool Fuzzer**, prompt injection sanitization, toxic parameter logging |
| **Contributor Workflow** | Manual file inspection | **Automated Contributor GitOps CI/CD Gate (`scripts/validate_contributions.py`)**, Pydantic schema validation, anti-mock scanner |
| **Deployment** | Localhost only | **Live Vercel Frontend** (`https://kasauti.vercel.app`) + **Live Render Docker Backend** (`https://kasauti-api.onrender.com`) |
| **Test Verification** | 21 basic tests | **33 Comprehensive Production Pytest Fixtures** (100% Pass Rate) |

---

## 2. Detailed Technical Breakdown

### Part 1: Supabase Schema Migration & Cloud Object Storage
- **Relational Schema**: Authored and applied `supabase/migrations/0001_kasauti_schema.sql` defining 7 production tables with UUID primary keys, foreign key constraints, and JSONB telemetry payloads:
  - `targets`: Voice agent identity and telephony endpoints.
  - `benchmark_runs`: Run results, TRAI compliance scores, and surgical prompt diffs.
  - `sentinel_telemetry`: In-call guardrail execution metrics and sub-45ms latencies.
  - `fuzzer_logs`: Adversarial prompt and parameter injection audit logs.
  - `acoustic_benchmarks`: Ambient noise, packet drop, and WER benchmarks.
  - `hallmark_certificates`: Cryptographic SHA-256 compliance stamps.
  - `training_datasets`: Contributed Indic speech samples and metadata.
- **Supabase Storage Integration**: Created `apps/api/app/db/supabase_client.py` with direct public audio URL generation and upload capabilities to `kasauti-audio-artifacts.`.
- **Database Driver Resilience**: Standardized URL normalization in `apps/api/app/config.py` ensuring `postgresql://` and `postgres://` seamlessly adapt to `postgresql+asyncpg://` with RFC 3986 percent-encoded passwords.

### Part 2: Complete Purge of Mock Data & Mathematical Signal Degradation
- **Acoustic Engine (`apps/api/app/acoustic/engine.py`)**:
  - Implemented true signal degradation using `numpy` and `scipy.signal`.
  - Added acoustic ambient profiles: Bandra traffic (12 dB SNR), Chandni Chowk street market (8 dB SNR), and Indian kitchen pressure cooker whistle (5 dB SNR).
  - Implemented 2G GSM AMR downsampling to 8 kHz with simulated 18% packet loss.
  - Generates real playable 16-bit PCM WAV audio streams uploaded to Supabase Storage.
  - Computes exact Word Error Rate (WER) via dynamic programming matrix Levenshtein distance on tokenized text.
- **Sentinel Guardrail (`apps/api/app/sentinel/engine.py`)**:
  - High-precision wall-clock latency measurement with `time.perf_counter_ns()`.
  - Sub-45ms target SLA verification with word-boundary regex matching to eliminate false positives in Indic Romanized transcripts.
  - Persists real-time packet telemetry into Supabase `sentinel_telemetry`.
- **Adversarial Fuzzer (`apps/api/app/fuzzer/engine.py`)**:
  - Injects prompt injection strings and SQL/command escape sequences.
  - Tracks sanitization defenses and logs execution events to Supabase `fuzzer_logs`.
- **Dynamic Knowledge Topology (`apps/api/app/routes/knowledge.py`)**:
  - Real-time aggregation of failures from Supabase benchmark and sentinel tables.
  - Purged all `Math.random()` simulation in `apps/web/app/knowledge/page.tsx` in favor of deterministic coordinate jitter.

### Part 3: Contributor GitOps CI/CD & Production Gate
- **Contributor Validation (`scripts/validate_contributions.py`)**:
  - Pydantic schema validation for contributed Indic speech datasets (`hi`, `hinglish`, `kn`, `en-IN`).
  - Audio validation inspecting WAV headers for sample rates (8 kHz or 16 kHz) and duration bounds (1.0s to 120.0s).
  - Static Code Anti-Mock Scanner: Enforces that no production code in `apps/api/app` or `apps/web/app` contains forbidden mock identifiers (`MOCK_`, `faker`, `Math.random()`).
- **Production Synchronization (`scripts/sync_training_data.py`)**:
  - Computes SHA-256 audio hashes.
  - Syncs contributor files to Supabase Storage and issues idempotent `UPSERT` queries to `training_datasets`.
- **GitHub Actions Automation**:
  - `.github/workflows/ci-gate.yml`: PR validation gate running pytest, schema validation, anti-mock scanner, and Next.js production build.
  - `.github/workflows/cd-sync-prod.yml`: CD pipeline deploying updates to production upon merge.

### Part 4: Production Cloud Deployments
- **Backend on Render**:
  - Multi-stage `apps/api/Dockerfile` with native `ffmpeg` binary.
  - Live at `https://kasauti-api.onrender.com/health` (Status 200).
- **Frontend on Vercel**:
  - Next.js 14 deployed at `https://kasauti.vercel.app`.
  - Configured edge proxy rewrites and CORS headers.

---

## 3. Test Suite Verification Metrics

All 33 automated production test fixtures run and pass cleanly:
```
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-9.0.2, pluggy-1.6.0
collected 33 items

tests\test_fixtures_contract.py ..                                       [  6%]
tests\test_judge.py ....                                                 [ 18%]
tests\test_knowledge_and_budget.py ....                                  [ 30%]
tests\test_production_platform.py ........                               [ 54%]
tests\test_rules.py ........                                             [ 78%]
tests\test_safety.py ....                                                [ 90%]
tests\test_webhooks.py ...                                               [100%]

====================== 33 passed, 13 warnings in 24.20s =======================
```
