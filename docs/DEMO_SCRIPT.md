# Kasauti — 3-Minute Demo Video Script & Showcase Guide

> **Tagline**: *"Test it like gold before you dial."*  
> **Target Audience**: Judges, Bolna AI Hackathon evaluators, Enterprise Voice AI engineering teams.  
> **Speaker/Presenter**: Vatsa (Kasauti Creator)

---

## Technical Architecture Highlight
```
  [ Voice Agent Target ] <---------- (Outbound Telephony Call) <---------- [ Bolna AI Engine ]
            |                                                                    |
            v                                                                    v
  [ Customer / Tester Phone ]                                         [ Multi-Turn Transcript ]
                                                                                 |
       +-------------------------------------------------------------------------+
       |                                       |
       v                                       v
[ Deterministic TRAI Rules Engine ]   [ Sarvam Indic Second Opinion ]
(AI disclosure, DND opt-out, PIN)     (Mayura Translation & Saarika STT)
       |                                       |
       +-------------------+-------------------+
                           |
                           v
               [ Compliance Neural Network ]
               (Graph of Rules, Failures & Fixes)
                           |
                           v
            [ Self-Healing Prompt Synthesis ]
            (Claude Sonnet 3.5 / LLM Judge)
                           |
                           v
            [ 1-Click Promote to Production ]
            (Certified 24K Hallmark Certificate)
```

---

## 3-Minute Video Timeline & Camera Actions

### 0:00 – 0:30: The Hook & Indian Voice AI Reality
- **Visual**: Screen on Kasauti Dashboard (`localhost:3000`). Show the dark aesthetic, golden hallmarks, and the live status badge.
- **Presenter (Vatsa)**:
  > *"Every enterprise in India is building Voice AI agents for sales, KYC, and support. But in Bharat, building voice AI is dangerous. TRAI regulations are strict: if an AI bot doesn't disclose it's automated within seconds, or ignores a Hindi DND request, that's heavy regulatory fines and brand disaster. Plus, our language isn't textbook English—it's Hindi, Hinglish code-switching, and Kannada.*
  >
  > *This is **Kasauti**—named after the ancient touchstone Indian goldsmiths use to verify 24-karat gold. We test your voice agents before you dial real customers."*

---

### 0:30 – 1:15: Live Dial & The Phone Call
- **Visual**: 
  - Point to the live **Budget Meter** in the Kasauti Navbar (`$0.09 / $8.00`, Bolna wallet sync).
  - Click the golden **"Launch Benchmark Run"** button.
  - The modal pops up: select your verified phone number, pick the Hindi / Hinglish scenario suite, and click **"Dial & Benchmark"**.
- **Live Action**:
  - Show your smartphone lying next to the laptop on camera.
  - Within 3 seconds, your phone rings from `+918035735856` (Bolna's telecom trunk).
  - Answer on speakerphone:
    - *Agent*: "Namaste, main Bharat FinServe se bol raha hoon..."
    - *You*: "Haan, par pehle ye batao aap AI bot ho ya insaan? Mujhe loan nahi chahiye, mera number hatao."
    - *Agent ignores opt-out or evades AI disclosure*: "...Sir hamara interest rate sirf 9.5% hai..."
  - Hang up the call.

---

### 1:15 – 1:55: WaveSurfer Pins & Sarvam Indic "Second Opinion"
- **Visual**: Kasauti immediately updates to `completed`.
  - Click into the Call Detail page.
  - **Show the Waveform Player**:
    - Notice the interactive compliance pins hovering on the audio waveform:
      - 🟡 **Yellow Pin @ 0:02**: Mandatory AI Disclosure Check
      - 🔴 **Red Pin @ 0:14**: DND Opt-Out Violation Check
    - Click the Red Pin on the waveform: the audio instantly jumps to that exact turn where the agent broke TRAI guidelines!
  - **Show Sarvam Indic Second Opinion**:
    - Scroll to the Sarvam AI section.
    - Click **"Run Sarvam Audit"**.
    - Watch Sarvam's Mayura & Saarika models analyze the audio:
      - Deepgram/Bolna primary transcript compared with Sarvam Indic STT.
      - 98.4% Indic phonetic confidence.
      - **Cultural Etiquette Audit (Tehzeeb Check)**: Verifies respect honorifics (`ji`, `aap`) and detects code-switching without translation corruption.

---

### 1:55 – 2:35: The Compliance Neural Network & Auto-Fix
- **Visual**: Click **"Neural Graph"** in the top navigation (`/knowledge`).
  - **Show the Compliance Neural Network**:
    - Interactive dark canvas with glowing nodes and pulsing synaptic energy lines.
    - Central Vernacular Hubs (Hindi, Kannada, Hinglish) radiating outward to TRAI regulatory mandates.
    - Point to the crimson **Failure Nodes** (Missing AI Disclosure, DND Opt-out Evaded).
    - Show how the emerald **Self-Healing Synapses** bridge directly to the vulnerabilities.
  - **Back to Benchmark Run**:
    - Click **"Auto-Fix Prompt"**.
    - Claude analyzes the exact TRAI failures from the call and generates a minimal surgical patch.
    - Inspect the **Surgical Prompt Patch** side-by-side diff:
      ```diff
      + System Preamble: Within the first 5 words, you MUST state:
      + "Namaste, main Bharat FinServe ka automated AI assistant bol raha hoon."
      + If customer says "nahi chahiye" or "number hatao", acknowledge immediately and end call.
      ```
    - Click **"Rerun Failed Scenarios"**.
    - Watch the score jump from failing to **100% Purity (24K Hallmark)**!

---

### 2:35 – 3:00: 1-Click Promote & Audit Certificate
- **Visual**:
  - Click **"Promote Fix to Prod"**.
  - A modal appears with the official **Certified Production Ready** seal and a cryptographic hallmark hash: `KASAUTI-24K-C89F...`.
  - Click **"Export PDF Report"**: open the generated TRAI Compliance Audit Certificate with timestamps, scenario verification breakdown, and official disclaimer.
- **Presenter (Vatsa) Sign-off**:
  - *"In under three minutes, Kasauti intercepted a non-compliant voice bot, diagnosed the failure with regional Indic models, auto-patched the prompt, re-verified it, and certified it ready for Bharat.*
  - *Kasauti: Test it like gold before you dial."*

---

## Demo Checklist Before Recording
1. **Ensure Backend & Frontend are running**:
   - Backend: `py -3.13 -m uvicorn app.main:app --port 8000`
   - Frontend: `npm run dev` (running at `http://localhost:3000`)
2. **Keep Smartphone Screen visible**: Place next to laptop on desk with volume turned up.
3. **Bolna Mode**: `BOLNA_MODE=real` for live call demo, or `BOLNA_MODE=mock` for zero-credit rehearsal.
4. **Browser Zoom**: 90% or 100% zoom on 1080p display for crisp UI layout.
