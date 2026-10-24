---
doc: spec
status: approved
---

# Adaptive Execution Planner — Technical Specification

A modular, deterministic web application built with Next.js, React, TypeScript, and Tailwind CSS. The application cleanly decouples its algorithmic scheduling and replanning engine from UI rendering and state management, providing an independently testable, mathematically honest execution planner for students and solo builders.

Source references:
- `prd.md > The Core Journey`
- `prd.md > Screens and Layout`
- `prd.md > Look and Feel`
- `prd.md > Features and Behavior`
- `prd.md > States and Boundaries`

---

## How This Works, In Plain Language

The application is structured into four distinct layers:

1. **The Pure Scheduling Engine (`src/lib/engine.ts`):** 
   A standalone, pure TypeScript module with zero dependencies on React, browser APIs, or storage. It takes a goal, tasks, dependencies, and daily capacity, and returns an ordered schedule. It performs strict input validation (detecting cycles, duplicate IDs, invalid references, and non-positive effort), executes deterministic capacity bin-packing, evaluates multi-factor feasibility, and calculates validated recovery proposals. Every engine function is pure: it never mutates its inputs.
2. **Domain Data Types (`src/types/planner.ts`):** 
   Strict TypeScript interfaces defining domain entities (`Goal`, `Task`, `Milestone`, `DaySchedule`, `FeasibilityReport`, `ReplanPreview`, `RevisionRecord`).
3. **Application State & Persistence (`src/context/PlannerContext.tsx` & `src/lib/storage.ts`):** 
   A React Context powered by `useReducer` for predictable, unidirectional state transitions. A validated persistence layer safely validates data from `localStorage` using runtime schema validation, strictly guarded against Server-Side Rendering (SSR) hydration mismatches. Replan previews exist only in component memory; the reducer commits changes and records revision history only upon explicit user confirmation.
4. **UI Components (`src/components/*`):** 
   Presentational React components styled with accessible Tailwind CSS following the light-theme design system. Components display state and dispatch reducer actions, never computing scheduling algorithms or mutating state directly.

---

## The Core Journey Through the System

Traced from `prd.md > The Core Journey`:

1. **Arrival & Initial Load:**
   - User loads `http://localhost:3000`.
   - `PlannerContext` mounts. `storage.ts` safely reads `localStorage` only after client-side hydration.
   - If no valid saved plan exists, the application renders `GoalSetup.tsx`.
2. **Sample Loading or Custom Form Submission:**
   - Clicking "Try Sample Project" pre-fills the form with the relative 7-day ML project data (2.0 hrs/day, Day 1 through Day 7).
   - Submitting triggers `generateInitialSchedule()` in `engine.ts`.
   - The engine validates dependencies, executes deterministic topological allocation across Day 1 through Day 7, and returns the initial `ScheduleResult`.
   - The reducer dispatches `INITIALIZE_PLAN`, committing the state and persisting it to `localStorage`.
3. **Execution & Progress Tracking (Day 1):**
   - User transitions to `ExecutionDashboard.tsx`.
   - User marks Day 1 tasks complete. The component dispatches `TOGGLE_TASK_COMPLETION(taskId)`.
   - Reducer marks the task `completed` on the current day, recalculates progress counters, and persists to `localStorage`. Completed tasks are permanently locked and cannot be moved or deleted by replanning.
4. **Disruption (Day 2 Slip):**
   - On Day 2, a task remains incomplete or capacity is lost.
   - The dashboard alerts the user that work is overdue and activates the prominent "Replan" button.
5. **Replan Review:**
   - User clicks "Replan". `ExecutionDashboard` opens `ReplanReviewModal.tsx`.
   - The modal calls `computeReplanPreview()` in-memory with current state and incomplete tasks.
   - The engine preserves completed tasks, recalculates incomplete tasks against remaining days, evaluates multi-factor feasibility, and generates a `ScheduleDiff` and recovery options. No active state is mutated.
6. **Recovery Selection & Confirmation:**
   - User selects an option (e.g., extend deadline by 1 day, increase hours, or reduce scope). The engine re-runs full allocation and feasibility in memory to preview the outcome.
   - User clicks **"Apply Revised Plan"**.
   - The commit boundary verifies the preview's validity and dispatches `APPLY_REVISION(revisedSchedule, reason, summary)`.
   - The reducer commits the new schedule, appends exactly one record to `revisionHistory`, and saves to `localStorage`.
   - If the user clicks **"Cancel"**, the modal closes with zero state changes.

---

## Stack

- **Framework:** Next.js 15+ (App Router).
  - *Doc:* [https://nextjs.org/docs](https://nextjs.org/docs)
  - *Rationale:* Standard modern React framework, clean build process, and straightforward Vercel deployment path.
- **Language:** TypeScript 5+.
  - *Doc:* [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
  - *Rationale:* Strict typing prevents runtime nulls and enforces mathematical data models.
- **Styling:** Tailwind CSS.
  - *Doc:* [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
  - *Rationale:* Utility-first styling enabling the exact custom light-theme palette, tabular numerals, crisp borders, and accessible contrast required by `prd.md > Look and Feel`.
- **Testing:** Vitest.
  - *Doc:* [https://vitest.dev/](https://vitest.dev/)
  - *Rationale:* Fast, modern, native TypeScript test runner with zero configuration friction. Executes via `npm test`. (Jest is NOT used).
- **State Management:** Native React `useReducer` + Context API.
  - *Rationale:* Clean unidirectional state transitions with zero external store dependencies.

---

## Where It Runs and How Someone Tries It

- **Runtime Environment:** Modern web browser running on Node.js v18+ (tested on Node v22.22).
- **Start Command:**
  ```bash
  npm install
  npm run dev
  ```
- **Access URL:** Open `http://localhost:3000` in any browser.
- **Test Command:**
  ```bash
  npm test
  ```
- **Optional Deployment:** Vercel (zero-config Next.js deployment via `npx vercel` or GitHub integration).

---

## Look and Feel Specifications

Implements `prd.md > Look and Feel`:

- **Theme & Surfaces:**
  - Base Background: `bg-slate-50` (`#f8fafc`).
  - Card Surfaces: `bg-white` (`#ffffff`) with border `border-slate-200` (`#e2e8f0`) and `shadow-sm`.
- **Palette Tokens:**
  - Primary / Active: Deep Indigo (`text-indigo-700`, `bg-indigo-600`, `hover:bg-indigo-700`, `#4338ca`).
  - Neutral Text: Headings `text-slate-900` (`#0f172a`), Secondary `text-slate-600` (`#475569`), Muted `text-slate-400`.
  - Completed: Emerald `text-emerald-700`, `bg-emerald-50`, `border-emerald-200`.
  - Warning / Near Limit: Amber `text-amber-800`, `bg-amber-50`, `border-amber-200`.
  - Conflict / Infeasible / Blocked: Crimson `text-red-700`, `bg-red-50`, `border-red-200`.
- **Typography:**
  - Font Family: Clean system sans / Inter (`font-sans`).
  - Numbers & Counters: Monospace tabular numerals (`font-mono` / `tabular-nums`) for timers, day badges, and capacity fractions.

---

## Deterministic Allocation & Scheduling Algorithm

Implemented purely in `src/lib/engine.ts`:

### 1. Input Validation Rules
Before any scheduling logic runs, `validateInputs()` verifies:
1. **Unique Task IDs:** No two tasks share the same `id`.
2. **Positive Finite Effort:** Every task has `estimatedHours > 0` and `Number.isFinite(estimatedHours)`.
3. **Valid Dependency References:** Every ID in `task.dependencies` exists in the task list.
4. **Acyclicity:** Dependency graph contains zero circular dependencies (verified using Kahn's algorithm).
If any validation fails, the engine immediately aborts and returns diagnostic error objects without scheduling.

### 2. Task Sorting & Tie-Breaking Rules
Tasks ready for scheduling are sorted deterministically using stable tie-breakers:
1. **Priority:** `high` (3) > `medium` (2) > `low` (1).
2. **Dependency Depth:** Tasks with longer downstream dependency chains are scheduled earlier to prevent downstream blocking.
3. **Original Input Order / Task ID:** Stable fallback ensuring identical input always yields an identical schedule.

### 3. Bin-Packing Allocation Rules
- Tasks are placed wholly into day buckets (Day 1 through Day $N$). Tasks are never fractionally split.
- A task can only be placed on Day $d$ if:
  - All its prerequisite tasks are either completed on Day $< d$, or scheduled on Day $< d$.
  - $\text{Current Day Allocated Hours} + \text{task.estimatedHours} \le \text{dailyCapacity}$.
- The scheduler places each task on the **earliest valid day** satisfying both constraints.
- If a task cannot fit on any day before the deadline, it is assigned `scheduledDay: undefined` and added to `unscheduledTasks` with an explicit reason code:
  - `OVERSIZED_TASK`: Task effort > daily capacity.
  - `CAPACITY_EXCEEDED`: Daily capacity full on all eligible days.
  - `DEPENDENCY_BOTTLENECK`: Prerequisite chain forces task past the deadline.

---

## Comprehensive Feasibility Standards

The engine's `evaluateFeasibility()` produces a `FeasibilityReport`:

```typescript
export interface DiagnosticIssue {
  taskId?: string;
  type: 'CYCLE_DETECTED' | 'INVALID_INPUT' | 'OVERSIZED_TASK' | 'CAPACITY_EXCEEDED' | 'DEPENDENCY_BOTTLENECK';
  message: string;
}

export interface FeasibilityReport {
  isFeasible: boolean; // TRUE only if 100% of required incomplete tasks are scheduled on or before deadline
  remainingEffortHours: number;
  availableCapacityHours: number;
  shortfallHours: number; // Math.max(0, remainingEffort - availableCapacity)
  diagnostics: DiagnosticIssue[];
  unscheduledTaskIds: string[];
}
```

**Standard:** A plan is feasible if and only if:
1. Input is completely valid.
2. `shortfallHours === 0` (aggregate hours fit).
3. `unscheduledTaskIds.length === 0` (every task successfully fits into a valid day before the deadline without dependency or daily capacity violations).

---

## Recovery Option Evaluation Rules

When `isFeasible === false`, `evaluateRecoveryOptions()` evaluates 3 explicit recovery solutions by running the exact same allocation and feasibility engine on cloned inputs:

1. **Option 1: Increase Daily Availability:**
   - Computes minimum required daily capacity:
     $$C' = \max\left(\text{dailyCapacity}, \left\lceil \frac{\text{Remaining Effort}}{\text{Remaining Days}} \times 10 \right\rceil / 10\right)$$
   - Re-runs `allocateTasksToDays()` with $C'$.
   - If feasible, generates preview showing resolved schedule and increased daily workload.
2. **Option 2: Extend Deadline:**
   - Computes required extra days:
     $$\Delta D = \left\lceil \frac{\text{Shortfall Hours}}{\text{dailyCapacity}} \right\rceil$$
   - Re-runs `allocateTasksToDays()` with $\text{totalDays} + \Delta D$.
   - Re-runs feasibility check to ensure dependency bottlenecks are also cleared.
3. **Option 3: Reduce Scope:**
   - Identifies incomplete, lowest-priority task(s) whose removal eliminates the capacity shortfall.
   - **Downstream Impact Disclosure:** Automatically traverses the dependency graph to find all downstream tasks depending on the dropped task(s), flagging them as blocked or dropped.
   - Identifies affected milestones and modified completion criteria.
   - Re-runs allocation and feasibility on the reduced task set to verify that the remaining plan is 100% feasible.
   - Requires explicit user confirmation.

---

## State and Persistence Contracts

### Reducer Actions (`src/context/PlannerContext.tsx`)

```typescript
export type PlannerAction =
  | { type: 'INIT_SAVED_STATE'; payload: PlannerState }
  | { type: 'INITIALIZE_PLAN'; payload: { goal: Goal; milestones: Milestone[]; tasks: Task[]; schedule: DaySchedule[] } }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string } }
  | { type: 'APPLY_REVISION'; payload: { revisedSchedule: DaySchedule[]; revisedTasks: Task[]; reason: string; summary: string } }
  | { type: 'RESET_GOAL' };
```

### State Transition Invariants
- `INIT_SAVED_STATE`: Validates `localStorage` JSON against schema. If invalid or corrupted, logs warning and initializes clean Goal Setup state.
- `TOGGLE_TASK_COMPLETION`: Toggles task status. If marking completed, records `completedOnDay = state.currentDay`. If unchecking, sets status to `pending`. Updates progress metrics immutably.
- `APPLY_REVISION`:
  - **Commit Boundary Guard:** Validates that the preview schedule is non-empty, contains no cycles, and preserves all previously completed tasks. Rejects invalid previews.
  - Commits new schedule and tasks.
  - Appends a new `RevisionRecord` to `state.revisionHistory` with timestamp and summary.
- `RESET_GOAL`: Resets state to initial empty state and clears `localStorage`.
- **Purity:** Engine functions and preview calculations never dispatch reducer actions. Cancelling a modal simply unmounts the modal component with zero state side effects.

### Safe SSR Persistence (`src/lib/storage.ts`)
- Storage methods check `typeof window !== 'undefined'` before touching `localStorage`.
- React components load saved state inside a `useEffect` on mount to prevent SSR hydration mismatch warnings.

---

## Components

1. `GoalSetup` (`src/components/GoalSetup.tsx`): Goal creation and "Try Sample Project" prefill button.
2. `ExecutionDashboard` (`src/components/ExecutionDashboard.tsx`): Main dashboard view.
3. `DashboardSummary` (`src/components/DashboardSummary.tsx`): Top metric bar, countdown, progress, and "Start New Goal" button.
4. `TodayFocus` (`src/components/TodayFocus.tsx`): Today focus panel with capacity utilization.
5. `ScheduleView` (`src/components/ScheduleView.tsx`): Day 1 to Day N column cards.
6. `TaskCard` (`src/components/TaskCard.tsx`): Checkbox, effort, milestone, completion criterion, dependency badges.
7. `ReplanReviewModal` (`src/components/ReplanReviewModal.tsx`): Feasibility breakdown banner, diff, recovery options.
8. `RevisionHistory` (`src/components/RevisionHistory.tsx`): Past revision drawer.

---

## File Structure

```text
build-with-ai-basics/
├── devpost/
│   ├── learner-profile.md     # Kept out of git via .gitignore
│   ├── scope.md               # Approved product scope
│   ├── prd.md                 # Approved product requirements document
│   └── spec.md                # Approved technical specification
├── src/
│   ├── app/
│   │   ├── globals.css        # Tailwind directives and custom theme variables
│   │   ├── layout.tsx         # Root HTML layout with font imports
│   │   └── page.tsx           # Main page orchestrator (Setup vs. Dashboard)
│   ├── components/
│   │   ├── GoalSetup.tsx          # Goal creation & "Try Sample Project" prefill
│   │   ├── ExecutionDashboard.tsx # Active planner dashboard shell
│   │   ├── DashboardSummary.tsx   # Top metric bar & countdown
│   │   ├── TodayFocus.tsx         # Today panel with capacity progress
│   │   ├── ScheduleView.tsx       # Day 1..N columns
│   │   ├── TaskCard.tsx           # Checkbox, effort, milestone, completion criterion
│   │   ├── MilestonesSummary.tsx  # Milestones progress list
│   │   ├── ReplanReviewModal.tsx  # Feasibility banner, diff, recovery options
│   │   └── RevisionHistory.tsx    # Lightweight past revision drawer
│   ├── context/
│   │   └── PlannerContext.tsx     # React Context & useReducer for state
│   ├── lib/
│   │   ├── engine.ts              # PURE scheduling engine (topological sort, allocation, diff)
│   │   ├── sampleData.ts          # Deterministic 7-day ML project generator
│   │   └── storage.ts             # Safe localStorage persistence with runtime validation & SSR guards
│   └── types/
│       └── planner.ts             # Shared domain TypeScript interfaces
├── tests/
│   └── engine.test.ts             # Vitest unit tests verifying engine invariants
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vitest.config.ts
```

---

## Test Specifications (`tests/engine.test.ts`)

Vitest test suite verifying all core engine invariants and failure modes:

1. **Input Validation:**
   - Rejects duplicate task IDs with `INVALID_INPUT`.
   - Rejects zero, negative, or `NaN` effort with `INVALID_INPUT`.
   - Rejects missing dependency references with `INVALID_INPUT`.
   - Detects circular dependencies (A $\rightarrow$ B $\rightarrow$ A) and returns `CYCLE_DETECTED` with the cycle path.
2. **Deterministic Allocation & Tie-Breaking:**
   - Validates that tasks are scheduled strictly in topological order (no task on or before its prerequisite's day).
   - Validates that day capacity limits are never exceeded.
   - Validates that identical inputs run multiple times produce identical day-by-day schedules.
3. **Feasibility Diagnostics:**
   - Flags `OVERSIZED_TASK` when a task's duration exceeds daily capacity.
   - Flags `CAPACITY_EXCEEDED` when remaining hours exceed available capacity.
   - Flags `DEPENDENCY_BOTTLENECK` when aggregate hours fit but sequential prerequisite chains push a task past the deadline.
4. **Replanning & Completed Work Preservation:**
   - Verifies that tasks marked `completed` retain their `completedOnDay` and are never moved or deleted by `computeReplanPreview()`.
   - Verifies that engine functions do not mutate input state objects.
5. **Recovery Proposals:**
   - Verifies that "Increase Daily Availability" calculates a capacity that genuinely resolves the shortfall.
   - Verifies that "Extend Deadline" calculates extra days that clear both capacity and dependency bottlenecks.
   - Verifies that "Reduce Scope" identifies downstream dependent tasks and affected milestones.
6. **State & Persistence:**
   - Verifies that cancelling a replan preview leaves state and revision history untouched.
   - Verifies that corrupted `localStorage` JSON triggers safe fallback to setup state without crashing.

---

## Decisions and Open Issues

### Key Technical Decisions
- **Vitest instead of Jest:** Modern, native TypeScript support with zero configuration bloat. Runs via `npm test`.
- **Pure Functional Engine:** `src/lib/engine.ts` has zero DOM, React, or storage imports, making it 100% testable in Vitest.
- **Commit Boundary Validation:** Previews are purely ephemeral; the reducer verifies preview validity before committing a revision.

### Open Questions
None. Architecture, component boundaries, data models, engine contracts, and test specifications are completely defined and aligned with the PRD.
