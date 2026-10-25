# Adaptive Execution Planner

A practical, deterministic goal-to-execution planning application built for students and independent builders. It transforms ambitious goals into achievable daily schedules constrained by target deadlines and daily available hours, and adapts honestly when plans slip.

Unlike optimistic chatbots or rigid checklists, Adaptive Execution Planner couples an intuitive execution interface with a pure TypeScript scheduling engine that mathematically evaluates plan feasibility, calculates transparent schedule diffs, and presents validated recovery options without silently dropping work or moving deadlines.

---

## Key Features

- **Deterministic Scheduling Engine (`src/lib/engine.ts`):** Allocates tasks to project days using Kahn's topological sort and capacity bin-packing, strictly enforcing prerequisite ordering and daily hour limits.
- **Multi-Factor Feasibility Diagnostics:** Distinguishes between aggregate hour deficits (`CAPACITY_SHORTFALL`) and sequential prerequisite constraints (`DEPENDENCY_BOTTLENECK`). A plan is never falsely declared feasible just because total hours fit.
- **Daily Execution Dashboard (`TodayFocus`):** Focuses attention on today's scheduled work, displays real-time capacity meters, flags overdue work from previous days, and tracks milestone progress.
- **In-Memory Replan Review & Schedule Diff:** Previewing a reschedule computes an in-memory diff (identifying unchanged, moved, blocked, or unscheduled tasks) without mutating active state or writing revision records until explicitly confirmed.
- **Validated Recovery Options:** Generates 3 deterministic recovery proposals:
  1. *Increase Daily Hours* (calculates exact daily capacity needed).
  2. *Extend Deadline* (computes required extra days).
  3. *Reduce Scope* (identifies optional/lowest-priority tasks and discloses downstream dependency cascades).
- **Immutable Revision History:** Logs every confirmed plan change with timestamps, reasons, and capacity metrics.
- **Safe Browser Persistence:** SSR-safe, schema-validated `localStorage` persistence that survives page reloads without hydration mismatches.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PPurab-006/build-with-ai.git
   cd build-with-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Testing

The scheduling engine and state management are covered by automated unit tests:

```bash
# Run Vitest test suite (27 tests across 5 test suites)
npm test

# Run TypeScript type check
npx tsc --noEmit

# Compile production build
npm run build
```

---

## Core Journey Walkthrough (Reviewer Guide)

To evaluate the proof of concept end-to-end in 2–3 minutes:

1. **Orientation & Prefill:**
   - On the Goal Setup screen, click **"Try Sample Project"**.
   - Review the prefilled 7-day machine-learning project (2 hours/day available, 6 tasks with dependency constraints).
2. **Generate Initial Plan:**
   - Click **"Generate Plan"**.
   - Observe the active Execution Dashboard: Day 1 through Day 7 schedule, milestone progress, and the Today Focus card with capacity meter.
3. **Progress Tracking (Day 1):**
   - Click the checkmark on Task 1 (*"Setup dev environment & download dataset"*).
   - Observe the progress bar and capacity meter update immediately. Refresh the page to verify local persistence.
4. **Simulate Real-World Disruption (Day 2 -> Day 3):**
   - In the Today Focus card, click **"Next Day"** to advance to Day 3 without completing Day 2's task (*"Data preprocessing & EDA"*).
   - Observe the amber alert: *"1 task scheduled for earlier days is incomplete"* and notice that downstream Task 3 is blocked by incomplete dependencies.
5. **Adaptive Replan ("The Replan Review"):**
   - Click **"Replan"** in the navigation bar.
   - The modal opens: observe the **Infeasible** banner explaining the exact mathematical reason (a sequential dependency bottleneck cannot fit within remaining days at current constraints).
   - Inspect the **Schedule Diff** table showing which tasks moved and which are blocked.
   - Under **Recovery Options**, select **"Extend Deadline (+1 Day to Day 8)"**.
   - Observe the feasibility status immediately switch to green (**Feasible**).
6. **Confirm & Inspect Revision History:**
   - Click **"Apply Revised Plan"**.
   - The dashboard updates to show the revised schedule extending to Day 8.
   - Click **"History"** in the top navigation to view the immutable audit entry recording the replan reason and before/after metrics.

---

## Technical Architecture

- **Framework:** Next.js 15 (App Router), React 18, Tailwind CSS, Lucide icons.
- **State Management:** React Context + `useReducer` with validated `localStorage` persistence.
- **Pure Engine:** Standalone, deterministic TypeScript module (`src/lib/engine.ts`) with 0 external dependencies.
- **Testing:** Vitest with TypeScript support.

---

## License

This project is open-source under the [MIT License](LICENSE).
