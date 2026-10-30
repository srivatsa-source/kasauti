# Kasauti (कसौटी) — 3-Minute Demo Video Script & Showcase Guide

> **Tagline**: *"Test it like gold before you dial."*  
> **Target Audience**: Judges, Bolna AI Hackathon evaluators, Enterprise Voice AI engineering teams.  
> **Speaker/Presenter**: Vatsa (Kasauti Creator)  
> **Live Production**: [https://kasauti.vercel.app](https://kasauti.vercel.app) | [https://kasauti-api.onrender.com](https://kasauti-api.onrender.com)

---

## Technical Architecture Highlight
```
  [ Voice Agent Target ] <---------- (Outbound Telephony Trunk) <---------- [ Bolna.ai Engine ]
            |                                                                    |
            v                                                                    v
  [ Customer / Tester Phone ]                                         [ Multi-Turn Telemetry ]
                                                                                 |
       +-------------------------------------------------------------------------+
       |                                       |                                 |
       v                                       v                                 v
[ Deterministic TRAI Engine ]       [ Sentinel <45ms Sidecar ]        [ Acoustic Stress Engine ]
(AI disclosure, DND opt-out, PII)   (Real-time In-Call Intercept)     (Bandra & 2G GSM AMR Noise)
       |                                       |                                 |
       +-------------------+-------------------+---------------------------------+
                           |
                           v
               [ Compliance Neural Network ]
               (Graph of Rules, Failure Clusters & Indic Fixes)
                           |
                           v
             [ Agentic Tool Injection Fuzzer ]
             (Prompt Injection, Toxic Slot Poisoning)
                           |
                           v
             [ Self-Healing Prompt Synthesis ]
             (Targeted Diff Patch + GitHub PR Bot)
                           |
                           v
             [ Certified 24K Hallmark Certificate ]
             (SHA-256 Tamper-Proof Cryptographic Stamp)
```

---

## 3-Minute Video Timeline & Camera Actions

### 0:00 – 0:30: The Hook & Indian Voice AI Reality
- **Visual**: Screen on Kasauti Dashboard ([https://kasauti.vercel.app](https://kasauti.vercel.app)). Show the minimalist B/W monochrome aesthetic, live Render backend health indicator, and the cryptographic hallmark certificates.
- **Presenter (Vatsa)**:
  > *"Every enterprise in India is rushing to deploy Voice AI agents for sales, collections, KYC, and support. But in Bharat, voice AI is high-risk territory. TRAI regulations are strict: if an AI bot fails to disclose its automated nature in the first few words, or ignores a Hindi DND request, that's heavy statutory penalties and brand disaster. Plus, Indian calls don't happen in quiet studios—they happen in 2G traffic in Bandra or noisy kitchens in Bangalore.*
  >
  > *This is **Kasauti**—named after the ancient touchstone Indian goldsmiths use to verify pure 24-karat gold. We subject voice AI agents to rigorous regulatory benchmarks, adversarial tool fuzzing, and Indian acoustic stress testing before they dial real citizens."*

---

### 0:30 – 1:15: Live Dial & Real Telephony Benchmarking
- **Visual**: 
  - Point to the live **Budget Meter** in the Kasauti Navbar (`$0.09 / $8.00`, synced with Bolna wallet).
  - Click the **"Launch Benchmark Run"** button.
  - The modal pops up: select your verified phone number, pick the Hindi / Hinglish scenario suite, and click **"Dial & Benchmark"**.
- **Live Action**:
  - Show your smartphone lying next to the laptop on camera.
  - Within 3 seconds, your phone rings from Bolna's telecom trunk.
  - Answer on speakerphone:
    - *Agent*: "Namaste, main Bharat FinServe se bol raha hoon..."
    - *You*: "Haan, par pehle ye batao aap AI bot ho ya insaan? Mujhe loan nahi chahiye, mera number hatao."
    - *Agent ignores opt-out or evades AI disclosure*: "...Sir hamara interest rate sirf 9.5% hai..."
  - Hang up the call.

---

### 1:15 – 1:55: Sub-45ms Sentinel & Acoustic Stress Engine
- **Visual**: Navigate to the **Sentinel Interceptor** tab (`/sentinel`) and **Acoustic Stress Lab** (`/acoustic`):
  - **Show Sentinel In-Call Guardrail**:
    - Show live streaming packet interception.
    - Wall-clock latency clock: **31.4ms** (well below the 45ms telecom audio packet threshold).
    - Demonstrate how Sentinel intercepts compliance violations mid-call and prepends statutory AI disclosures before the synthetic voice packet hits the customer.
  - **Show Indian Acoustic Stress Simulation**:
    - Select **Bandra Traffic** (12 dB SNR) and **Pressure Cooker Whistle** noise profiles.
    - Toggle **2G GSM AMR 8kHz Downsampling** with 18% packet loss simulation.
    - Play the degraded audio waveform and show the true Levenshtein Word Error Rate (WER) degradation jumping from 4.2% to 31.8%.

---

### 1:55 – 2:35: The Compliance Neural Network & Auto-Fix
- **Visual**: Click **"Neural Graph"** in the top navigation (`/knowledge`):
  - **Show the Compliance Topology**:
    - Fullscreen interactive synaptic mesh linking TRAI regulatory mandates, Indic vernacular clusters (Hindi, Hinglish, Kannada), and real failure telemetry aggregated from Supabase.
    - Click into a red failure node: notice the exact timestamp, statutory fine exposure (₹50,000 per violation), and underlying turn transcript.
  - **Auto-Fixing Prompt Patch**:
    - Click **"Propose Surgical Fix"**.
    - Watch Kasauti analyze the failure modes and synthesize a minimal prompt diff:
      ```diff
      + System Preamble: Within the first 5 words, you MUST state:
      + "Namaste, main Bharat FinServe ka automated AI assistant bol raha hoon."
      + If customer says "nahi chahiye" or "number hatao", acknowledge immediately and terminate call.
      ```
    - Click **"Rerun Benchmark"**: Watch the purity score jump from failing to **98.4% Gold Standard**!

---

### 2:35 – 3:00: Cryptographic Hallmark Certificate & 1-Click Production Sync
- **Visual**:
  - Click **"Generate Hallmark Certificate"** (`/verify/KASAUTI-2026-BOLNA-01`).
  - Show the tamper-proof cryptographic verification stamp backed by SHA-256 signatures stored in Supabase.
  - Click **"Open GitHub PR"**: Kasauti's GitOps bot opens a clean PR against the voice agent's repository with the verified prompt fix and compliance test artifacts.
- **Presenter (Vatsa) Sign-off**:
  - *"In under three minutes, Kasauti intercepted a non-compliant voice bot, stress-tested it through Indian acoustic conditions, generated a sub-45ms guardrail, auto-patched the prompt, verified it via SHA-256 hallmark, and safely deployed it to staging.*
  - *Kasauti: Test it like gold before you dial."*

---

## Pre-Flight Demo Checklist
1. **Live Deployments Ready**:
   - Vercel Frontend: `https://kasauti.vercel.app`
   - Render Backend: `https://kasauti-api.onrender.com/health` (Status 200)
   - Supabase DB & Storage: Active with 7 tables and `kasauti-audio-artifacts.` bucket
2. **Local Fallback (if running locally)**:
   - Backend: `uvicorn app.main:app --app-dir apps/api --port 8000`
   - Frontend: `npm run dev --prefix apps/web` (`http://localhost:3000`)
3. **Telephony Credentials**:
   - `BOLNA_API_KEY` active with funded balance.
   - Verified personal mobile number configured in `BOLNA_TARGET_PHONE`.
