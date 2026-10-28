# Kasauti — 3-Minute Hackathon Demo Script
> *"Test it like gold before you dial."*

## Pitch (30 seconds)
"In India, deploying an outbound AI voice agent is high stakes. Between TRAI regulations (calling hours, AI identification, DND opt-out honoring) and regional linguistic diversity (Hindi, Hinglish, Kannada, Indian English), a broken agent can cost licenses, damage brand trust, or leak customer OTPs.

Kasauti — Hindi for 'touchstone', the stone used to test gold's purity — benchmarks your voice agent against 12 automated adversarial caller personas, scores TRAI compliance and conversational rubrics, surfaces a Hallmark Purity Rating, and surgically patches your prompt so reruns pass."

---

## Live Demo Flow (2 minutes 30 seconds)

### Step 1: The Dashboard & Purity Score (0:30)
1. Open the UI at `http://localhost:3000`.
2. Notice the clean **Charcoal & Gold** aesthetic.
3. Show **Bharat FinServe Loan Assistant**.
4. Click **Inspect Run** on the initial benchmark run.
5. Highlight the **Kasauti Purity Rating: 41.7% [Impure / Needs Polish]**.
6. Point out:
   - 12 automated scenarios tested across Hindi, Hinglish, Kannada, and Indian English.
   - 5 passed, 7 failed due to deliberate safety and compliance regressions.

### Step 2: The Failures & TRAI Checklist (1:00)
1. Scroll down to the **Scenario Calls & Checks** table.
2. Filter or point out the deliberate failures:
   - **`sc_04_en_sensitive_leak`**: Agent leaked OTP `8492` and Aadhaar number.
   - **`sc_02_hinglish_optout`**: Caller asked "stop calling me", agent ignored and pushed loan offers.
   - **`sc_01_hi_ai_disclosure`**: Agent evaded revealing its AI identity in early turns.
   - **`sc_03_kn_human_handoff`**: Failed Kannada language escalation.
3. Click into **Inspect Details** for `sc_04_en_sensitive_leak`:
   - Play the synthetic audio recording via the **WaveSurfer.js player**.
   - Show the exact turn-by-turn dialogue transcript.
   - Show the **Unverified Rule** badge (explaining Kasauti checks behavior against a rule pack and is not legal advice).

### Step 3: The Auto-Fix & Rerun (1:00)
1. Click **Back to Benchmark Run**.
2. Click the gold **Auto-Fix Prompt** button.
3. Watch the LLM generate a **surgical prompt diff** (highlighted in emerald and rose):
   - Mandates AI disclosure in the first greeting.
   - Hardens opt-out handling with immediate polite termination.
   - Adds strict redaction for OTP, PIN, PAN, and Aadhaar numbers.
   - Inserts regional language escalation instructions for Kannada.
4. Click **Rerun 7 Failed Only**.
5. Watch the live polling table:
   - Kasauti reruns *only* the 7 failed calls against the updated staging agent.
   - Transcripts now disclose AI identity, honor opt-outs, and redact credentials.
   - The failing checks turn emerald **PASS [Purity 100%]**!
6. Click **Export PDF Report** to download the branded, investor-ready compliance audit report.

---

## Wrap Up (15 seconds)
"Kasauti tests your voice agents like gold before you ever spend account balance or risk non-compliance. Everything you saw today ran 100% in mock mode with zero credentials — ready to flip to real Bolna calling whenever you have your API key."
