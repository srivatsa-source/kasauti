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

The following core components, design tokens, and pages have already been rebuilt and migrated to the Gumroad Neo-Brutalist visual language:

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
- **`apps/web/components/SarvamSecondOpinion.tsx`**:
  - Vernacular audit card with turn-by-turn Indic diff, English translation tab, and Indian telephone etiquette audit.
- **`apps/web/app/calls/[id]/page.tsx`**:
  - Detailed call execution view with chat transcript bubbles, persona meta, and compliance checklist.
- **`apps/web/app/knowledge/page.tsx`**:
  - Compliance neural network graph with canvas synapse visualizer, filter pills, health score cards, and synaptic node inspector.

---

## 3. Production Build & Compilation Verification (COMPLETED)

- **Typography Standardized**: Loaded `Space Grotesk` (`--font-space-grotesk`) and `Inter` (`--font-inter`) via `next/font/google` for pixel-consistent display rendering across all devices.
- **Next.js Production Build**: `npm --prefix apps/web run build` completed with **Exit Code 0**!
- All 6 application routes compiled and verified successfully:
  - `○ /` (Home, Gumroad Hero, Bento Showcase, Targets, Runs table) — 7.59 kB
  - `○ /runs` (Runs History Page) — 2.17 kB
  - `ƒ /runs/[id]` (Dynamic Run Detail Page with Diff & Auto-Patch) — 6.01 kB
  - `ƒ /calls/[id]` (Dynamic Call Inspection & Audio Waveform Player) — 7.32 kB
  - `○ /knowledge` (Compliance Neural Topology Visualizer) — 4.84 kB
  - `○ /_not-found` (404 Fallback) — 873 B
- **TypeScript Typecheck**: Verified clean (`tsc -p apps/web --noEmit` exited with code 0).
- **Core Functionality & APIs**: 100% preserved with zero regressions.

---

## 4. Summary of Design Principles Realized

1. **Contrast**: Stark `#000000` boundaries with high-saturation pops (`#ff90e8`, `#ffc900`, `#90a8ed`) on `#f4f4f0`.
2. **Balance**: Asymmetrical visual balance matching Gumroad hero (headline + CTA vs 3D coin artwork).
3. **Emphasis**: Clear focal hierarchy from the display title to primary CTA and highlighted yellow bento stats card.
4. **Proportion / Scale**: Giant display fonts juxtaposed with monospace micro-tags.
5. **Hierarchy**: 3-level typography: Colossal Condensed Display -> Bento Section Headers -> Monospace metadata.
6. **Repetition / Consistency**: Unified 2px/3px black borders, `4px 4px 0px #000` shadows, and diagonal arrow `↗` badges.
7. **Rhythm**: Alternating card heights and rhythmic horizontal compartmentalized borders.
8. **Pattern**: Repeating architectural bento grids and uniform badge structures.
9. **White Space**: Deliberate padding preventing visual crowding.
10. **Movement / Direction**: Diagonal orientation (`↗`) and floating 3D tokens with cartoon motion marks.
11. **Variety**: Varied card styles (white cards, electric yellow stat cards, 4-circle comic strip vignettes).
12. **Unity**: Unified design identity across Navbar, Modals, Audio Player, Diff Viewer, and Layout Footer.
