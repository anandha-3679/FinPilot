# FinPilot × ApexBroker Task Plan

## Architecture Overview
- **Host App (ApexBroker)**: Realistic mock fintech platform (Dashboard, Portfolio, SIPs, Goals, Activity, Add Investment Modal, 30-day check-in alerts).
- **Embedded Modal (FinPilot SDK)**: Decoupled, pseudonymous impact calculation and Decision Memory layer (Step 1: Why + Decision Memory, Step 2: Impact & Alternatives, Step 3: Confirm).
- **Deterministic Impact Engine**: Zero-API, mathematically rigorous compound interest and trajectory modeling (`r = (1 + 0.12)^(1/12) - 1`, value lost, goal delay, milestone curves).
- **UI & Aesthetics**: Groww-inspired modern Indian fintech aesthetics — crisp dark theme, clean typography (Inter/Manrope), emerald/teal positive accents, soft card borders, Lucide icons, rich interactive charts (Allocation Donut, SIP trajectories, Drawdown bars).
- **Tech Stack**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Vitest.

## Current Status & Verification
All core deliverables and acceptance criteria are completed and verified:
- **Acceptance Tests**: 7/7 Vitest tests passing in [`src/engine/impactEngine.test.ts`](file:///c:/Users/Anandha%20Lakshmi/FinPilot/src/engine/impactEngine.test.ts) (±1% tolerance met for all delay and loss benchmarks).
- **Production Build**: Verified with `npm run build` (`dist/` generated with zero TypeScript or Vite errors).
- **Deployment Config**: [`vercel.json`](file:///c:/Users/Anandha%20Lakshmi/FinPilot/vercel.json) rewrite rule configured for static SPA routing.
- **Development Server**: Active on `http://127.0.0.1:5173/`.

## Immediate Next Steps (Optional Polish / Future Scope)
- [ ] Connect remote Git origin for automatic Vercel continuous deployment.
- [ ] Add screenshot walkthrough in submission documentation.

## Completed Tasks
- [x] Initialized Git repository and token-efficient `.antigravityrules`.
- [x] Generated repomix codebase map and configured `.gitignore`.
- [x] Initialized Vite React + TypeScript project with Tailwind CSS, Lucide React, and Recharts.
- [x] Configured quiet linter (`eslint --quiet .`) and quiet test runner (`vitest run --silent`).
- [x] Implemented deterministic math engine (`src/engine/impactEngine.ts`) according to Section 7 specs:
  - Monthly compounding rate: `r = (1 + 0.12)^(1/12) - 1`
  - Exact compound summation for value lost and delay calculations
- [x] Implemented formatting utilities (`src/engine/format.ts`) for Indian numbering (`₹10,53,000`, `₹1.82 lakh`) and strict uppercase labels (`SIP`, `SIPs`, `NAV`, `AUM`, `AMFI`).
- [x] Implemented and verified Vitest acceptance suite (`src/engine/impactEngine.test.ts`) against all 7 Section 12 test cases.
- [x] Built global state store (`src/state/store.ts`) with localStorage persistence, Aarav Mehta seed data, and reset capabilities.
- [x] Developed Groww-inspired UI with dark fintech palette, crisp cards, and rich interactive charts:
  - Allocation Donut chart with matching segment legends
  - "If You Stay vs If You Change" trajectory line chart
  - Market Worry historical drawdown recovery table
- [x] Built ApexBroker host app with 5 functional tabs:
  - Dashboard (metrics, allocation chart, active SIPs, goal progress)
  - Portfolio (holdings table with Buy More and Withdraw actions)
  - SIPs (cards with Pause SIP and Reduce SIP triggers, live status badges)
  - Goals (milestone progress and linked funds)
  - Activity (Decision Memory management, 30-day check-in alerts, transaction logs)
- [x] Built Add Investment dialog with live non-blocking "FinPilot insight" line.
- [x] Built embeddable FinPilot modal (`src/finpilot/FinPilotModal.tsx`):
  - Blurred host backdrop and 3-step wizard (1 Why → 2 Impact → 3 Confirm)
  - Decision Memory matching ("You've been here before" with past outcomes & suggested plans)
  - 3 equal-size, equal-weight alternative cards + quiet single "...anyway" link
  - Simulated guardrailed LLM typeout with 800ms abort fallback rule
  - "Why am I seeing this?" collapsible inspection panel with editable 12% assumption
- [x] Built single-scroll Landing page (`src/landing/Landing.tsx`) with instant demo entry in ≤ 3 clicks.
- [x] Built hidden demo control panel (`src/host/HiddenDemoPanel.tsx`) toggled by pressing the `D` key (Market mode, LLM speed, Reset demo).
- [x] Configured `vercel.json` rewrite for static SPA deployment.
- [x] Conducted end-to-end browser walkthrough and verified full decision loop.
