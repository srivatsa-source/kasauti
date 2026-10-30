# UI Rebuild & Design Modernization Plan (`UI_PLAN.md`)

> **Kasauti — Voice Agent Quality & Compliance Testing Platform**  
> _Target Design Identity: Gumroad Neo-Brutalism (Based on reference UI)_

---

## 1. Executive Summary & Objective

The objective of this UI overhaul is to transform Kasauti's interface from a generic dark dashboard into the iconic **Gumroad Neo-Brutalist** aesthetic seen in the reference visual design.

### Core Constraints & Invariants:

1. **Zero Functionality Breaking**: All backend endpoints, API payloads, state polling, audio stream players, diff viewers, and database records remain 100% intact.
2. **12 Design Principles Strict Adherence**: Contrast, Balance, Emphasis, Proportion, Hierarchy, Repetition, Rhythm, Pattern, White Space, Movement, Variety, and Unity.
3. **High-Converting & Engaging UX**: High-contrast black outlines (`2px`–`3px`), hard offset shadows (`4px 4px 0px #000`), punchy display typography, vibrant accent cards (Bubblegum Pink, Electric Yellow, Periwinkle, Mint), and tactile interactive press states.

---

## 2. Progress Tracker: Completed Work

Every single core component, design token, dashboard view, and lab page has been successfully built, styled, and verified:

### A. Design Tokens & Foundations

- **`apps/web/tailwind.config.ts`**:
  - Added brutalist palette: `brutal-bg` (`#f4f4f0`), `brutal-pink` (`#ff90e8`), `brutal-yellow` (`#ffc900`), `brutal-purple` (`#90a8ed`), `brutal-mint` (`#23a094`), `brutal-green` (`#7fe382`), `brutal-black` (`#000000`).
  - Added brutalist box shadows: `shadow-brutal` (`4px 4px 0px 0px #000`), `shadow-brutal-sm`, `shadow-brutal-lg`, `shadow-brutal-xl`.
  - Added font families: `font-display` (Impact / Arial Black / Cabinet Grotesk / sans-serif), `font-mono`.
- **`apps/web/app/globals.css`**:
  - Configured off-white canvas base (`#f4f4f0`), dark brutalist scrollbars, `.btn-brutal`, `.card-brutal`, `.card-brutal-hover`, and tactile active press transformations (`active:translate-x-0.5 active:translate-y-0.5`).
- **`apps/web/app/layout.tsx`**:
  - Replaced dark mode wrapper with Gumroad light canvas.
  - Added signature Gumroad bubblegum pink ticker / banner (`"TEST IT LIKE GOLD BEFORE YOU DIAL"`).
  - Added brutalist 4-column footer with crisp borders, links, and regulatory notice.

### B. Navigation & Badges

- **`apps/web/components/Navbar.tsx`**:
  - Compartmentalized black borders (`border-b-2 border-black bg-white`).
  - Kasauti brandmark with `"K"` circle badge.
  - Active navigation pill badges (`bg-black text-white shadow-[2px_2px_0px_#ff90e8]`).
  - Live budget pill with real Bolna balance display.
  - Primary CTA button matching Gumroad `"Start selling ↗"`: `[ Launch Benchmark ↗ ]`.
  - Secondary navigation dropdown ("Labs & Tools") providing direct access to Acoustic Stress, Tool Fuzzer, Live Sentinel, and CI/CD Deployer.
  - Responsive mobile drawer menu covering all core routes and labs.
- **`apps/web/components/PurityScoreBadge.tsx`**:
  - Redesigned into a 24K hallmark wax stamp / coin stamp with thick borders and brutalist shadows.
- **`apps/web/components/UnverifiedRuleBadge.tsx`**:
  - Yellow caution sticker tag with solid black border and offset shadow.
  - Legal disclaimer banner with white background, yellow accent icon, and bold notice typography.

### C. Landing & Core Dashboard

- **`apps/web/app/page.tsx`**:
  - **Hero Section**: 1-to-1 recreation of Gumroad's `"GO FROM 0 TO $1"` hero -> `"GO FROM 0 TO 100% PURITY"` with colossal condensed typography, search bar, and floating 3D isometric 24K gold hallmark coin illustration with retro motion lines.
  - **Bento Grid**: 5 modular bento cards:
    - _Card 1_: `"TEST ANYTHING"` with retro audio window illustration.
    - _Card 2_: `"AUTO-PATCH STAGING"` with phone mockup and code diff sticker.
    - _Card 3_: Electric Yellow Highlight Card (`"REAL BENCHMARKS. REAL PURITY."`) with big metric and stepped black bar chart.
    - _Card 4_: Multi-Lingual Indic coverage checklist (Hindi, Hinglish, Kannada, Indian English).
    - _Card 5_: Stack integrations (Bolna, Sarvam, Webhook).
  - **Comic Strip**: 4 circular story vignette frames demonstrating the test workflow.
  - **Target Management**: Preserved interactive targets grid with brutalist cards and `"Run 12 Scenarios"` action.
  - **Benchmark Runs Table**: Clean brutalist table with live purity badges and drill-down links.
  - **Add Target Modal**: Brutalist modal window with tactile inputs and validation.

### D. Modals, Detail Views & Media

- **`apps/web/components/NewRunModal.tsx`**:
  - Thick 3px black border, `10px 10px 0px #000` shadow, language filter pills, scenario selection checkboxes, pre-flight cost calculation, and primary benchmark launch button.
- **`apps/web/app/runs/page.tsx`**:
  - Historical table with status chips and inspect links.
- **`apps/web/app/runs/[id]/page.tsx`**:
  - Run detail page with top purity hallmark stamp, scenario count cards, live polling, PDF export, auto-fix prompt button, rerun failed button, 1-click promote-to-prod modal, and calls table.
- **`apps/web/components/PromptDiff.tsx`**:
  - Neo-brutalist side-by-side / inline diff viewer with green/red borders and monospace syntax highlighting.
- **`apps/web/components/AudioPlayer.tsx`**:
  - Tape-deck retro waveform player with black/pink/yellow audio waves, compliance marker pins (`AI Disclosure`, `Consent`, `Violation`), and tactile transport controls.
- **`apps/web/components/RealtimeVoiceWaveform.tsx`**:
  - Brutalist oscilloscope with live Web Audio FFT frequencies, dBFS metering, tactile mic tester, and Bolna recording playback.
- **`apps/web/components/SarvamSecondOpinion.tsx`**:
  - Vernacular audit card with turn-by-turn Indic diff, English translation tab, and Indian telephone etiquette audit.
- **`apps/web/app/calls/[id]/page.tsx`**:
  - Detailed call execution view with chat transcript bubbles, persona meta, and compliance checklist.
- **`apps/web/app/knowledge/page.tsx`**:
  - Compliance neural network graph with canvas synapse visualizer, filter pills, health score cards, and synaptic node inspector.

---

## 3. Platform Labs & Advanced Capabilities (COMPLETED)

All expanded capabilities are fully modernized with the Gumroad Neo-Brutalist design language:

### A. Live Telemetry Dashboard (`apps/web/app/telemetry/page.tsx`)
- Connected to `GET /telemetry/live` with live auto-refresh polling and custom Agent ID query.
- Call metadata ribbon: status chip, execution ID, created time, duration, carrier, caller, and destination phone number.
- Live turn-by-turn stream with distinct speech bubbles for Bolna Agent (pink) and User (yellow).
- Audio player playback when Bolna `recording_url` is present.
- Config warning state for missing Bolna API keys or unconfigured agents.

### B. Autonomous CI/CD Deployer (`apps/web/app/deployer/page.tsx`)
- Connected to `POST /deployer/bolna-sync` and `POST /deployer/git-pr`.
- Production safety isolation banner preventing direct writes to production Bolna agents.
- Interactive deployment configuration form with staging vs prod target selection, branch name, commit message, and prompt preview.
- Pull request artifact card rendering PR URL, branch name, and verification hallmark metadata.

### C. Verifiable Hallmark Marketplace (`apps/web/app/marketplace/page.tsx`)
- Connected to `GET /marketplace/certificates`, `GET /marketplace/verify/{cert_id}`, and `POST /marketplace/issue`.
- Public certificate gallery with agent name, purity hallmark score, statutory standing, dialect coverage tags, and issue date.
- Search filter by agent name or certificate ID.
- "Issue New Hallmark" modal with live form validation, dialect selection, and instant ledger update.
- Copyable Markdown and HTML badges with tactile copy buttons.

### D. Public Hallmark Verification Page (`apps/web/app/verify/[id]/page.tsx`)
- Connected to `GET /marketplace/verify/{cert_id}`.
- Colossal condensed display typography with Kasauti Trust Authority 24K seal stamp.
- 3-column telemetry strip (Purity Rating, Statutory Standing, Carrier Target).
- Verified Indic dialect pills and SHA-256 verifiable hash inspection.
- Live badge visual preview and copyable Markdown/HTML embed snippets.
- Clean error/revoked certificate state with button to browse marketplace.

### E. Acoustic Stress Testing (`apps/web/app/acoustic/page.tsx`)
- Connected to `GET /acoustic/profiles` and `POST /acoustic/simulate`.
- Telephony noise profiles: Traffic, Market, Static, Subway, Office.
- Audio synthesis simulator and Word Error Rate (WER) degradation breakdown.

### F. Tool & Prompt Fuzzer (`apps/web/app/fuzzer/page.tsx`)
- Connected to `GET /fuzzer/summary`, `GET /fuzzer/results`, and `POST /fuzzer/run`.
- Adversarial prompt injection attacks and telephony tool misuse test ledger with pass/fail badges.

### G. Live Sentinel Interceptor (`apps/web/app/sentinel/page.tsx`)
- Connected to `GET /sentinel/metrics`, `GET /sentinel/logs`, and `POST /sentinel/intercept`.
- Real-time streaming guardrail inspection sandbox with latency measurements and safety verdicts.

---

## 4. Production Build & Compilation Verification (COMPLETED)

- **Typography Standardized**: Loaded `Space Grotesk` (`--font-space-grotesk`) and `Inter` (`--font-inter`) via `next/font/google`.
- **Next.js Production Build**: `npm --prefix apps/web run build` completed with **Exit Code 0**!
- All 12 application routes compiled and verified successfully:
  - `○ /` (Home, Gumroad Hero, Bento Showcase, Targets, Runs table) — 8.01 kB
  - `○ /_not-found` (404 Fallback) — 873 B
  - `○ /acoustic` (Acoustic Stress Lab) — 2.87 kB
  - `ƒ /calls/[id]` (Dynamic Call Inspection & Audio Waveform Player) — 7.36 kB
  - `○ /deployer` (Autonomous CI/CD Deployer & Bolna Sync) — 4.54 kB
  - `○ /fuzzer` (Adversarial Security Fuzzer) — 3.63 kB
  - `○ /knowledge` (Compliance Neural Topology Visualizer) — 4.85 kB
  - `○ /marketplace` (Hallmark Certificate Marketplace) — 4.94 kB
  - `○ /runs` (Runs History Page) — 2.17 kB
  - `ƒ /runs/[id]` (Dynamic Run Detail Page with Diff & Auto-Patch) — 6.02 kB
  - `○ /sentinel` (Live Guardrail Interceptor) — 3.62 kB
  - `○ /telemetry` (Live Bolna Telemetry Stream) — 4.11 kB
  - `ƒ /verify/[id]` (Public 24K Verifiable Hallmark Proof) — 3.78 kB
- **TypeScript Typecheck**: Clean (`tsc -p apps/web --noEmit` exited with code 0).
- **Backend Test Suite**: Clean! All 25 unit/integration tests passed in mock mode (`25 passed in 8.73s`).
- **Core Functionality & APIs**: 100% preserved with zero regressions.

---

## 5. Summary of Design Principles Realized

1. **Contrast**: Stark `#000000` boundaries (`2px`/`3px`) with high-saturation pops (`#ff90e8`, `#ffc900`, `#90a8ed`, `#23a094`, `#7fe382`) on off-white `#f4f4f0`.
2. **Balance**: Asymmetrical visual balance matching Gumroad hero (condensed typography + CTA vs 3D coin artwork).
3. **Emphasis**: Clear focal hierarchy from display titles to primary CTAs and highlighted yellow bento stats cards.
4. **Proportion / Scale**: Giant display fonts juxtaposed with monospace micro-tags.
5. **Hierarchy**: 3-level typography: Colossal Condensed Display -> Bento Section Headers -> Monospace metadata.
6. **Repetition / Consistency**: Unified 2px/3px black borders, `4px 4px 0px #000` shadows, and diagonal arrow `↗` badges.
7. **Rhythm**: Alternating card heights and rhythmic horizontal compartmentalized borders.
8. **Pattern**: Repeating architectural bento grids and uniform badge structures.
9. **White Space**: Deliberate padding preventing visual crowding across all screen sizes.
10. **Movement / Direction**: Diagonal orientation (`↗`) and floating 3D tokens with cartoon motion marks.
11. **Variety**: Varied card styles (white cards, electric yellow stat cards, 4-circle comic strip vignettes).
12. **Unity**: Unified design identity across Navbar, Modals, Audio Player, Diff Viewer, Labs, and Layout Footer.

---

## 6. Final Validation Checklist

- [x] Backend test suite executed: 25/25 tests passed (`pytest tests -q`).
- [x] Frontend production build compiled: 12/12 routes generated with zero errors (`next build`).
- [x] Zero dark-mode legacy artifacts remaining (`zinc-950`/`zinc-900` completely eliminated).
- [x] Mobile navigation and responsive layouts tested across all breakpoints.
- [x] Tactile interactive states verified on all buttons, links, and forms.
- [x] No sensitive files or temporary build artifacts staged.
