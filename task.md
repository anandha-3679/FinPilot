# FinPilot × ApexBroker Task Plan

## Architecture Overview
- **Host App (ApexBroker)**: Realistic mock fintech platform (Dashboard, Portfolio, SIPs, Goals, Activity, Add Investment Modal, 30-day check-in alerts).
- **Embedded Modal (FinPilot SDK)**: Decoupled, pseudonymous impact calculation and Decision Memory layer (Step 1: Why + Decision Memory, Step 2: Impact & Alternatives, Step 3: Confirm).
- **Deterministic Impact Engine**: Zero-API, mathematically rigorous compound interest and trajectory modeling (`r = (1 + 0.12)^(1/12) - 1`, value lost, goal delay, milestone curves).
- **UI & Aesthetics**: Groww-inspired modern Indian fintech aesthetics — crisp dark theme, clean typography (Inter/Manrope), emerald/teal positive accents, soft card borders, Lucide icons, rich interactive charts (Allocation Donut, SIP trajectories, Drawdown bars).
- **Tech Stack**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Vitest.

## Current Status & Verification
All core deliverables, refinements, and unit test suites are completed and passing:
- **Unit Tests**: 16/16 Vitest unit tests passing in [`src/engine/impactEngine.test.ts`](file:///c:/Users/Anandha%20Lakshmi/FinPilot/src/engine/impactEngine.test.ts) covering math invariants, explanation string safeguards (no "₹₹", no " k ", no "1 months"), Indian formatting rules (`formatShortINR`), and pluralisation.
- **Production Build**: Verified with `npm run build` (`dist/` generated with zero errors).
- **UI Test Checklist**: 10/10 tests verified and documented in [`TESTING.md`](file:///c:/Users/Anandha%20Lakshmi/FinPilot/TESTING.md).
- **Development Server**: Active on `http://127.0.0.1:5173/`.

## Completed Refinements & Fixes
- [x] **Fix 1**: Step 3 Confirm reflects the specific selected option's impact (goal delay, value lost, and status transition), decoupled from raw pause slider values.
- [x] **Fix 2**: `onDecision` passes chosen new amount, duration, and resume date; Decision Memory records read formatted descriptions (e.g., *"Reduced UTI Nifty 50 to ₹5,000/mo for 3 months"*), updating SIP badges, dashboard totals, and goal cards after Done.
- [x] **Fix 3**: Time-bound SIP reduction with default 3 months auto-restore and "Make permanent" toggle; value lost and missed contributions calculated strictly over those N months (full horizon only if permanent).
- [x] **Fix 4**: "Suggested for you" badge dynamically lands on the non-Keep option with the lowest value lost fitting the reason.
- [x] **Fix 5**: All three alternative option cards dynamically pull from current slider/input amounts.
- [x] **Fix 6**: Modal title updated to "Review your SIP change"; pause card copy reads "Resumes automatically on <date>"; memory suggestion copy updated to "so some instalments continue".
- [x] **Fix 7**: Removed "from Section 9" in Hidden Demo panel; renamed "Magnitude / Span" to "Amount / Duration" in Activity tab.
- [x] **Fix 8**: Trajectory chart zoomed to last 24 months before goal date with explicit gap label (`formatShortINR`) at goal date.
- [x] **Fix 9**: Step 2 layout reordered: 1) Tiles, 2) Status chip, 3) AI explanation, 4) Alternatives; chart and historical dips table placed below as collapsible sections.
- [x] **Fix 10**: Dark-themed scrollbar and checkboxes configured in `src/index.css`.
- [x] **Fix 11 (Currency Formatting)**: Eliminated double ₹ ("₹₹") across all explanation strings by harmonizing templates and formatters.
- [x] **Fix 12 (Indian Units)**: Updated `formatShortINR` to avoid "k" notation; formats ≥ ₹10,000 as Indian units (e.g., ₹91,000 as "about ₹0.9 lakh", ≥ ₹1 lakh as "₹1.8 lakh", ≥ ₹1 crore as "₹1.2 crore"). Reused `formatShortINR` everywhere.
- [x] **Fix 13 (Pluralisation)**: Corrected pluralisation across explanation strings, sliders, and summaries ("1 month", "2 months").
- [x] **Fix 14 (WCAG AA Contrast)**: Raised green-on-dark contrast to WCAG AA standard (≥ 4.5:1) with `#4ADE80` on completed stepper labels/numerals, "You've been here before" heading, "View / delete my decision memory" link, goal-status chips (tinted background + light text), Confirm "Selected Decision" value, and slider value labels.
- [x] **Fix 15 (Cash Reserve Confirmation)**: On Confirm screen for "Use cash reserve / Use available cash", added rows for "Withdrawal: cancelled" and "Cash balance after: ₹X" (available cash − withdrawal amount). Executing Done updates host cash balance, Activity audit log, and Decision Record ("Used cash reserve ₹50,000 instead of withdrawing").
- [x] **Fix 16 (Explanation Invariant Unit Tests)**: Added Vitest unit tests verifying no explanation string contains "₹₹", " k ", or "1 months", plus tests for Indian units and pluralisation.
- [x] **Change 1 (Compass Logo)**: Replaced the FinPilot logo with a modern, simple compass mark (emerald/teal compass ring, dual-tone precision needle pointing NE, central pivot) in [`src/finpilot/CompassLogo.tsx`](file:///c:/Users/Anandha%20Lakshmi/FinPilot/src/finpilot/CompassLogo.tsx), applied to the Landing page header & hero, the FinPilot intelligence modal header, and `public/favicon.svg`. Kept ApexBroker's host logo distinct (letter "A" gradient square).
- [x] **Change 2 (Markets Page Redesign)**: Built a comprehensive markets view in [`src/host/MarketsTab.tsx`](file:///c:/Users/Anandha%20Lakshmi/FinPilot/src/host/MarketsTab.tsx) featuring major Indian indices (NIFTY 50, SENSEX, NIFTY MIDCAP 150, INDIA VIX), sectoral momentum heatmaps, institutional FII/DII flow context, and user invested fund performance strips. Sample data is labelled as such and stays dynamically synchronized with the Calm / Volatile demo setting.
- [x] **Change 3 (Bright Clean Theme)**: Re-themed the entire platform (Landing page, ApexBroker host application, all 6 tabs, Add Investment dialog, Hidden Demo panel, and FinPilot embeddable modal) to a bright, clean, premium theme (`bg-slate-50`, crisp `bg-white` cards with `border-slate-200`, `text-slate-900`, emerald green accents, high-contrast badges, light Recharts tooltips, and legible button states). Zero changes made to calculation logic, numbers, or flows.

## Completed Deliverables
- [x] Initialized Git repository and token-efficient `.antigravityrules`.
- [x] Initialized Vite React + TypeScript project with Tailwind CSS, Lucide React, and Recharts.
- [x] Configured quiet linter (`eslint --quiet .`) and quiet test runner (`vitest run --silent`).
- [x] Implemented deterministic math engine (`src/engine/impactEngine.ts`) and formatting utilities (`src/engine/format.ts`).
- [x] Built global state store (`src/state/store.ts`) with localStorage persistence, Aarav Mehta seed data, and reset capabilities.
- [x] Developed Groww-inspired UI with bright clean fintech palette, crisp cards, and rich interactive charts.
- [x] Built ApexBroker host app with 6 functional tabs (Dashboard, Markets, Portfolio, SIPs, Goals, Activity).
- [x] Built Add Investment dialog with live non-blocking "FinPilot insight" line.
- [x] Built embeddable FinPilot modal (`src/finpilot/FinPilotModal.tsx`).
- [x] Built single-scroll Landing page (`src/landing/Landing.tsx`).
- [x] Built hidden demo control panel (`src/host/HiddenDemoPanel.tsx`).
- [x] Configured `vercel.json` rewrite for static SPA deployment.
- [x] Verified full end-to-end user flows and documented in `TESTING.md`.
