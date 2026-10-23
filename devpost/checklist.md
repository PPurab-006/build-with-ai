---
doc: checklist
status: approved
---
# Build Checklist

Build mode: fast

## Slices

- [x] **1. Next.js Setup & Types**
  Becomes usable: A running Next.js app with Tailwind, displaying a basic page.
  Why now: Initializes the environment, styling system, and defines the core TypeScript interfaces the engine needs.
  PRD ref: `prd.md > Onboarding / Goal Creation`
  Spec ref: `spec.md > Stack & Dependencies`, `spec.md > Components and Architecture`
  Build: Scaffold Next.js App Router project, install Tailwind CSS, create `src/lib/types.ts` with Task, Goal, Schedule interfaces.
  Verify (mechanical): Start dev server and confirm it serves a page without errors.
  Learner check: Ensure the dev server starts and shows a basic page.
  Commit: `Setup Next.js and core types`

- [x] **2. The Planning Engine**
  Becomes usable: A deterministic scheduling algorithm that works locally.
  Why now: The engine is the core differentiator and constraint solver; building it early ensures all UI acts on valid, tested logic.
  PRD ref: `prd.md > Plan Generation and Validation`
  Spec ref: `spec.md > The Planning Engine`
  Build: Implement deterministic scheduling in `src/lib/engine.ts` handling dependency checks and daily time allocation. Add tests.
  Verify (mechanical): Run tests and confirm they pass, verifying time limits and dependencies.
  Learner check: Run tests and confirm engine logic works independently of UI.
  Commit: `Implement core scheduling engine and tests`

- [x] **3. State & Storage**
  Becomes usable: Data persists across page reloads in browser console.
  Why now: Ensures the execution view has stable data to read/write.
  PRD ref: `prd.md > Daily Execution`
  Spec ref: `spec.md > Storage & State`
  Build: Set up Zustand store in `src/lib/store.ts` managing goals/tasks, persisted to `localStorage`.
  Verify (mechanical): Write a task in console/dev tools, reload page, confirm it remains.
  Learner check: Verify state persists across page reloads in browser console.
  Commit: `Add Zustand store with localStorage persistence`

- [x] **4. UI - Goal Form & Mock Generation**
  Becomes usable: User can enter goal info and see tasks populated in state.
  Why now: Connects user intent to the engine to start the main loop.
  PRD ref: `prd.md > Goal Form`
  Spec ref: `spec.md > UI: Goal Form`
  Build: Create Goal form component, "Sample Goal" button, and mock `api/generate` API route returning a fixed JSON task list that the engine processes.
  Verify (mechanical): Submit form and check state updates with generated tasks.
  Learner check: Fill form, submit, and see tasks populated in state.
  Commit: `Implement Goal form and mock generation API`

- [x] **5. UI - Daily Execution View**
  Becomes usable: User can see today's tasks and mark them complete.
  Why now: Provides the actual workspace and progress tracking.
  PRD ref: `prd.md > Daily Execution`
  Spec ref: `spec.md > UI: Daily Execution View`
  Build: Build main dashboard (`app/page.tsx`), showing today's tasks, overdue tasks, and toggle completion.
  Verify (mechanical): Mark a task complete via UI and check if state is updated to complete.
  Learner check: Mark a task complete and verify it updates visually.
  Commit: `Build daily execution view and task completion`

- [x] **6. UI - Replanning Engine**
  Becomes usable: User can trigger a replan when tasks are missed.
  Why now: Closes the adaptive execution loop.
  PRD ref: `prd.md > Replanning Engine`
  Spec ref: `spec.md > UI: Replanning View`
  Build: Add a "Replan" button and preview modal. On confirm, re-run engine on pending tasks and update state.
  Verify (mechanical): Intentionally leave a past task incomplete, trigger replan, and confirm schedule shifts correctly.
  Learner check: Miss a task intentionally, replan, and confirm the schedule shifts.
  Commit: `Implement replanning view and engine integration`

## Hands-on Checkpoints

- [x] Early usable behavior explored — End of slice 4 (Form & Generation Checkpoint)
- [x] Final kick-the-tires exploration and feedback completed

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — prior practice connected
- [x] Optional edit and transfer reflection addressed — not applicable
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Tested invariants in `src/tests/engine.test.ts`
Route and stops: App -> API generate -> Store -> Engine -> Replan View
Edit outcome: Handled UI component extraction
Reflection: Not applicable
Activity mode: prior practice

## Revisions
- Restored code and logic, added tests for cyclic dependencies, time capacity, missing dependencies, etc.
- Modified AppStore updates so check marks instantly update.
