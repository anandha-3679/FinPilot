# FinPilot × ApexBroker Task Plan

## Architecture Overview
- **Host App (ApexBroker)**: Realistic mock fintech platform (Dashboard, Portfolio, SIPs, Goals, Activity, Add Investment Modal, 30-day check-in alerts).
- **Embedded Modal (FinPilot SDK)**: Decoupled, pseudonymous impact calculation and Decision Memory layer (Step 1: Why + Decision Memory, Step 2: Impact & Alternatives, Step 3: Confirm).
- **Deterministic Impact Engine**: Zero-API, mathematically rigorous compound interest and trajectory modeling (`r = (1 + 0.12)^(1/12) - 1`, value lost, goal delay, milestone curves).
- **UI & Aesthetics**: Groww-inspired modern Indian fintech aesthetics — crisp dark theme, clean typography (Inter/Manrope), emerald/teal positive accents, soft card borders, Lucide icons, rich interactive charts (Allocation Donut, SIP trajectories, Drawdown bars).
- **Tech Stack**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Vitest.

## Current Status & Verification
All core deliverables, refinements, and unit test suites are completed and passing:
- **Unit Tests**: 13/13 Vitest unit tests passing in [`src/engine/impactEngine.test.ts`](file:///c:/Users/Anandha%20Lakshmi/FinPilot/src/engine/impactEngine.test.ts) covering all ER and Home goal cases, time-bound vs permanent reduction, drawdowns, and invariants.
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

## Completed Deliverables
- [x] Initialized Git repository and token-efficient `.antigravityrules`.
- [x] Initialized Vite React + TypeScript project with Tailwind CSS, Lucide React, and Recharts.
- [x] Configured quiet linter (`eslint --quiet .`) and quiet test runner (`vitest run --silent`).
- [x] Implemented deterministic math engine (`src/engine/impactEngine.ts`) and formatting utilities (`src/engine/format.ts`).
- [x] Built global state store (`src/state/store.ts`) with localStorage persistence, Aarav Mehta seed data, and reset capabilities.
- [x] Developed Groww-inspired UI with dark fintech palette, crisp cards, and rich interactive charts.
- [x] Built ApexBroker host app with 5 functional tabs (Dashboard, Portfolio, SIPs, Goals, Activity).
- [x] Built Add Investment dialog with live non-blocking "FinPilot insight" line.
- [x] Built embeddable FinPilot modal (`src/finpilot/FinPilotModal.tsx`).
- [x] Built single-scroll Landing page (`src/landing/Landing.tsx`).
- [x] Built hidden demo control panel (`src/host/HiddenDemoPanel.tsx`).
- [x] Configured `vercel.json` rewrite for static SPA deployment.
- [x] Verified full end-to-end user flows and documented in `TESTING.md`.
