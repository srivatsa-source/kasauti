# Kasauti (कसौटी) — Roadmap & Future Horizons
> *"Test it like gold before you dial."*

This document tracks completed architectural milestones and deferred future capabilities beyond the current production release.

---

## 🏆 Completed in Production Release

The following capabilities have been fully engineered, validated with 33 test fixtures, and deployed to live production:

- [x] **Managed Cloud Database & Storage**: Supabase PostgreSQL with 7 schema tables and Supabase Object Storage (`kasauti-audio-artifacts.`) for Indic audio artifacts.
- [x] **Zero Mock Data Architecture**: Completely purged mock generators in favor of real Bolna telephony telemetry and live database aggregations.
- [x] **Indian Ambient Acoustic Stress Engine**: Mathematical noise carrier synthesis (`scipy.signal`), SNR ambient mixing (Bandra Traffic, Chandni Chowk, Pressure Cooker), 2G GSM AMR downsampling with 18% packet loss, and true dynamic programming Levenshtein WER computation.
- [x] **Sub-45ms In-Call Sentinel Guardrail**: Real-time streaming packet interceptor with wall-clock latency measurement (`time.perf_counter_ns()`) and word-boundary regex detection.
- [x] **Adversarial Tool Fuzzer**: Dynamic voice prompt injection and parameter sanitization defense evaluator.
- [x] **Contributor GitOps CI/CD Gate**: Automated Pydantic schema validation, anti-mock static code scanner, and automated Supabase dataset synchronization (`validate_contributions.py`, `sync_training_data.py`).
- [x] **Live Serverless Deployment**: Vercel frontend (`https://kasauti-five.vercel.app`) connected to Render Docker backend (`https://kasauti-api.onrender.com`).
- [x] **Cryptographic Hallmark Certification**: Tamper-proof SHA-256 verifiable compliance certificates (`/verify/[id]`).

---

## 🔮 Future Horizon (Post-Hackathon Roadmap)

### 1. Enterprise Multi-Tenancy & Access Control
- [ ] Role-Based Access Control (RBAC) with organization workspaces.
- [ ] Granular API keys for external CI/CD integrations.
- [ ] Per-tenant quota enforcement and usage metering.

### 2. Multi-Vendor Telephony Adapters
- [ ] Bland.ai telephony trunk adapter.
- [ ] Retell AI telephony adapter.
- [ ] Vapi telephony adapter.
- [ ] Generic SIP trunk connector for on-premise PBX systems (Asterisk/FreeSWITCH).

### 3. Advanced Indic Dialect & Acoustic Calibrations
- [ ] Additional Indian ambient profiles: Mumbai Local Train, Bangalore IT Cafeteria, Monsoon Downpour.
- [ ] Fine-grained phonetic dialect weighting for Bhojpuri, Maithili, Tulu, and Telugu.
- [ ] Multi-turn persona generation driven by fine-tuned local LLM judges.

### 4. Regulatory & Carrier Integrations
- [ ] Direct integration with National Do Not Call (NDNC) registry API for live DND status checks.
- [ ] Automated telecom operator consent ledger verification.
- [ ] Formal statutory compliance filing export (compliant with TRAI audit formats).
