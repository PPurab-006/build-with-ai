---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Scaffolding, Core Types, and Pure Deterministic Engine Verification**
  Becomes usable: A running Next.js application environment with verified pure scheduling algorithms (`src/lib/engine.ts`). Vitest passes all mathematical and invariant tests from the command line (Kahn's cycle detection, topological ordering, daily capacity bin-packing, and multi-factor feasibility detection).
  Why now: Proves the mathematical core, cycle detection, and bottleneck math before connecting it to UI, ensuring the foundation is rock-solid.
  PRD ref: `prd.md > 3. Deterministic Scheduling and Feasibility Engine`
  Spec ref: `spec.md > Stack`, `spec.md > Scheduling Engine Contracts`, `spec.md > Test Specifications`
  Build: Initialize Next.js project with Tailwind CSS and Vitest. Create domain types `src/types/planner.ts` and pure engine `src/lib/engine.ts`. Create `src/lib/sampleData.ts` for the 7-day ML project. Write unit tests in `tests/engine.test.ts`.
  Verify (mechanical): Run `npm test` to verify that all engine invariant tests pass with 0 failures; run `npm run build` to confirm TypeScript compiles cleanly.
  Learner check: Run `npm test` in the terminal and confirm that the deterministic scheduling, cycle detection, and capacity packing tests pass with green checks.
  Commit: `feat: scaffold project and implement pure deterministic scheduling engine with unit tests`

- [ ] **2. Goal Setup & 1-Click Sample Generation with Persistent Reducer State**
  Becomes usable: An interactive Goal Setup screen in the browser with full form validation and the "Try Sample Project" button. Clicking "Generate Plan" runs the engine and displays the active plan in state, persisting to `localStorage` across page refreshes.
  Why now: Delivers the entry point of the Core Journey and establishes safe client-side persistence and reducer state early, eliminating any risk of SSR hydration mismatches.
  PRD ref: `prd.md > 1. Goal Creation and Deterministic Sample Loading`, `prd.md > States and Boundaries (First Use State)`
  Spec ref: `spec.md > Components (GoalSetup)`, `spec.md > State and Persistence Contracts`, `spec.md > Look and Feel`
  Build: Implement `src/lib/storage.ts` with runtime validation and SSR checks. Implement `src/context/PlannerContext.tsx` with reducer actions. Create `src/components/GoalSetup.tsx` with clean light-theme styling and the "Try Sample Project" button. Wire up main `src/app/page.tsx` to toggle between setup and active states.
  Verify (mechanical): Start dev server, curl or fetch `http://localhost:3000`, run Vitest integration tests for storage and reducer initialization.
  Learner check: Open `http://localhost:3000`, click "Try Sample Project" to verify fields populate without auto-submitting, click "Generate Plan", reload the page, and confirm the active state persists.
  Commit: `feat: implement goal setup, deterministic sample prefill, and persistent planner state`

- [ ] **3. Execution Dashboard, Today Focus, and Task Management**
  Becomes usable: The complete Execution Dashboard. Displays the top metrics bar (countdown, progress, task counts), the Today Focus section with daily capacity meter, the full Day 1 to Day 7 schedule with dependency-ordered task cards, and milestone progress. Checking off tasks updates progress immediately and permanently logs completion.
  Why now: Delivers the primary daily interface where the user tracks work, completes Day 1 tasks, and encounters Day 2 slippage.
  PRD ref: `prd.md > 2. Daily Execution and Task Cards`, `prd.md > Screens and Layout (2. Execution Dashboard)`
  Spec ref: `spec.md > Components (ExecutionDashboard, DashboardSummary, TodayFocus, ScheduleView, TaskCard, MilestonesSummary)`
  Build: Implement `DashboardSummary.tsx`, `TodayFocus.tsx`, `ScheduleView.tsx`, `TaskCard.tsx`, `MilestonesSummary.tsx`, and `ExecutionDashboard.tsx`. Connect to `PlannerContext`. Implement "Start New Goal" with confirmation modal.
  Verify (mechanical): Run Vitest tests for task completion toggling, progress calculations, and persistence updates; verify component compilation with zero TypeScript errors.
  Learner check: Open the dashboard, complete Day 1's tasks, confirm that progress bars and capacity meters update immediately, reload to confirm persistence, and observe the Day 2 tasks becoming ready.
  Commit: `feat: implement execution dashboard, today focus, and interactive task tracking`

- [ ] **4. Replan Review Modal with Multi-Factor Feasibility, Schedule Diff, Recovery Options, and Revision History**
  Becomes usable: The defining differentiator of the application. On Day 2, when a task is missed or availability changes, clicking "Replan" opens the Replan Review modal. It displays the exact mathematical shortfall, the before-and-after schedule diff (unchanged, moved, blocked, unscheduled), and 3 verified recovery options (increase daily hours, extend deadline, reduce scope with downstream impact disclosure). Confirming commits the revision and logs revision history; cancelling leaves state untouched.
  Why now: Completes the entire core journey end-to-end, unlocking the exact "Oh, that's cool" demonstration moment required for the hackathon video and judging criteria.
  PRD ref: `prd.md > 4. Replan Review and Recovery Proposals`, `prd.md > 5. Plan History and Reset`, `prd.md > Screens and Layout (3. Replan Review Modal)`
  Spec ref: `spec.md > Components (ReplanReviewModal, RevisionHistory)`, `spec.md > Recovery Option Evaluation Rules`, `spec.md > Scheduling Engine Contracts (computeReplanPreview)`
  Build: Implement `ReplanReviewModal.tsx` and `RevisionHistory.tsx`. Wire up in-memory preview calculation, schedule diff rendering, dynamic recovery option previewing, commit boundary validation, and revision history logging in `PlannerContext`.
  Verify (mechanical): Run Vitest tests simulating Day 2 missed task replan, verifying shortfall calculation, diff generation, scope reduction dependency cascade, and cancellation safety with 0 mutations.
  Learner check: Simulate missing Day 2's task, click "Replan", inspect the mathematical shortfall and schedule diff, test recovery options (increase hours, extend deadline, drop task), click "Cancel" to verify nothing changed, reopen, click "Apply Revised Plan", and verify the new schedule and revision history entry appear.
  Commit: `feat: implement replan review modal, feasibility diagnostics, recovery proposals, and revision history`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 2 (Goal creation and persistent state in browser)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 4 (Full end-to-end demo flow)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be filled during learning wrap-up]
Route and stops: [to be filled during learning wrap-up]
Edit outcome: [to be filled during learning wrap-up]
Reflection: [to be filled during learning wrap-up]
Activity mode: [to be filled during learning wrap-up]

## Revisions

