---
doc: prd
status: approved
---

# Adaptive Execution Planner — Product Requirements

A practical, honest goal-to-execution planning application for students and solo builders that transforms ambitious ambitions into feasible daily schedules and adapts deterministically when plans slip.

Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

---

## The Core Journey

1. **Arrival & Orientation:** First-time users arrive at a clean, focused Goal Setup view explaining the app's purpose.
2. **Goal Input or Sample Load:** The user enters a custom goal (with actual dates and constraints) or clicks **"Try Sample Project"** to populate the form with a deterministic 7-day machine-learning project (2 hours/day) that operates on relative project days (Day 1 through Day 7) so the demonstration remains reproducible regardless of real-world calendar date.
3. **Plan Generation:** The user clicks "Generate Plan". The deterministic scheduling engine constructs a structured plan consisting of milestones, concrete actionable tasks with estimated effort and dependencies, and allocates tasks across project days respecting dependency ordering and the 2-hour daily capacity limit.
4. **Execution Dashboard:** The user transitions to the active Execution Dashboard, showing an overview summary, a dedicated **Today** focus section, a Day-by-Day schedule, milestone progress, and lightweight revision history.
5. **Progress Tracking (Day 1):** The user marks Day 1 tasks complete. Progress indicators update immediately, and completed tasks remain permanently logged.
6. **Disruption (Day 2):** The user encounters a real-world slip—a scheduled task is missed or available time is unexpectedly lost on Day 2. The dashboard displays an overdue/capacity warning.
7. **Replan Action:** The user clicks **"Replan"**. A dedicated **Replan Review** modal opens before any changes are committed.
8. **Feasibility & Diff Review:**
   - The engine evaluates feasibility against all constraints: remaining effort, available capacity before deadline, daily capacity limits, and dependency chains. A plan is never declared feasible solely because aggregate hours fit.
   - The default review state displays current constraints alongside any mathematical shortfall, identifying which tasks stay in place, which move, which are blocked, and which are unscheduled.
9. **Recovery Evaluation:** If the remaining schedule is infeasible (due to capacity deficit or dependency bottleneck), the planner presents 3 validated recovery options:
   - *Option 1: Increase Daily Availability* (adjust daily capacity and preview recalculated feasibility).
   - *Option 2: Extend Deadline* (adjust deadline date/days and preview recalculated feasibility).
   - *Option 3: Reduce Scope* (propose dropping specific lower-priority incomplete tasks with explicit disclosure of affected downstream dependencies, milestones, and success criteria).
10. **Confirmation:** The user confirms an option via **"Apply Revised Plan"** (updating the active schedule, preserving completed tasks, and logging a new revision entry) or clicks **"Cancel"** (leaving the existing schedule and history completely unchanged).

---

## Screens and Layout

The application consists of two primary screens and one focused modal overlay:

### 1. Goal Setup View
- **Header:** Brief, calm explanation of the planner's philosophy (honest constraints, realistic schedules).
- **Form Fields:**
  - Goal Title (text input).
  - Target Deadline (date picker for custom goals, or relative duration in days).
  - Daily Available Hours (numeric input, e.g., 2.0 hrs/day).
  - Current Starting Progress / Context (short text area).
  - Specific Constraints (optional text area).
- **Primary Actions:**
  - "Generate Plan" (primary button, deep indigo).
  - "Try Sample Project" (prominent secondary button, populates the form with the relative 7-day ML project without auto-submitting).

### 2. Execution Dashboard
- **Top Summary Bar:**
  - Goal Title.
  - Days Remaining / Deadline Countdown (tabular numbers; relative Day 1–7 countdown for sample, calendar countdown for user goals).
  - Overall Progress Bar and completion percentage.
  - Task Count (Completed vs. Total).
  - Remaining Estimated Effort vs. Total Effort.
  - "Start New Goal" button (requires explicit modal confirmation before clearing data).
- **Today Focus Panel (Top Section):**
  - Highlighted cards for tasks scheduled for the current project day.
  - Daily capacity meter (e.g., "1.5 / 2.0 hrs scheduled").
  - Quick completion checkboxes.
  - Next recommended action highlighted.
- **Day-by-Day Schedule Section:**
  - Sequential day columns/panels (adapts to project duration; Day 1 through Day 7 for sample project).
  - Day headers displaying project day/date, total planned hours, and capacity utilization.
  - Grouped task cards in strict topological dependency order.
  - Visual status indicators for completed, in-progress, upcoming, overdue, blocked, and unscheduled work.
- **Milestones Summary Panel:**
  - Compact overview of milestone names, target completion days, and completion progress bars.
- **Revision History Panel:**
  - Lightweight drawer or expandable section showing applied revisions: revision timestamp/number, trigger reason, and summary of moved, unscheduled, or scope-reduced tasks.
- **Header Action:**
  - Dedicated "Replan" action button with badge indicator when overdue tasks or schedule slippages exist. All capacity and deadline adjustments happen through this workflow rather than direct arbitrary edits.

### 3. Replan Review Modal / Drawer
- **Header:** "Replan Review — Schedule Adjustment".
- **Feasibility Breakdown Banner:**
  - Comprehensive constraint evaluation: Remaining Effort vs. Available Capacity + Dependency Feasibility.
  - Feasibility badge: "Feasible" (green) or "Infeasible: X-hour shortfall / dependency bottleneck" (crimson/amber).
  - Explanatory breakdown: Distinguishes between aggregate capacity deficits and dependency chain constraints.
- **Schedule Diff View (Default State):**
  - Compact before-and-after view comparing original vs. proposed dates under current constraints.
  - Explicit badges for *Unchanged*, *Moved*, *Blocked*, and *Unscheduled*.
  - Explicit explanation of causes (e.g., "Delayed due to missed prerequisite Task 2").
- **Recovery Options Selector (Active when Infeasible):**
  - Three distinct validated recovery solutions:
    1. **Increase Daily Availability:** Input to increase daily hours, recalculating preview and verifying feasibility.
    2. **Extend Target Deadline:** Input to add project days, recalculating preview and verifying feasibility.
    3. **Reduce Scope:** Proposes dropping specific lower-priority tasks. Explicitly highlights any affected dependent tasks, impacted milestones, and changed completion criteria.
- **Modal Actions:**
  - "Apply Revised Plan" (primary button; logs revision entry and commits changes).
  - "Cancel" (secondary button; closes modal leaving active plan, completed tasks, and revision history untouched).

---

## Look and Feel

- **Visual Style:** Polished, modern light theme designed as a serious execution workbench rather than a generic SaaS template.
- **Color Palette:**
  - Background: Warm off-white / light slate (`#f8fafc`).
  - Surfaces & Cards: Clean white (`#ffffff`) with subtle 1px border (`#e2e8f0`) and restrained shadow.
  - Primary / Selected: Deep Indigo (`#4338ca`).
  - Text: Slate 900 (`#0f172a`) for headings, Slate 600 (`#475569`) for body/secondary text.
  - Status Indicators:
    - Confirmed Success / Completed: Emerald Green (`#059669`).
    - Warning / Near Capacity: Warm Amber (`#d97706`).
    - Conflict / Shortfall / Infeasible / Blocked: Crimson Red (`#dc2626`).
- **Typography:**
  - Clean, high-legibility sans-serif (Inter / System Sans).
  - Headings: Semibold weights with restrained size hierarchy.
  - Tabular Numerals: Used for countdowns, hour counters, capacity meters, and progress percentages to prevent layout jitter.
- **Aesthetic Principles:**
  - Generous whitespace, precise alignment, subtle borders, no gratuitous glassmorphism, no rainbow gradients, and no decorative ungrounded charts.
  - High accessibility contrast and full keyboard operability.

---

## Features and Behavior

### 1. Goal Creation and Deterministic Sample Loading
- Source: `scope.md > The Core Loop (1)`.
- **Behavior:**
  - Form validates that Goal Title, Deadline (> 0 days), and Daily Hours (> 0) are provided.
  - "Try Sample Project" fills in:
    - Title: "Build and submit a working machine-learning project in 7 days"
    - Deadline: Relative 7-day schedule (Day 1 through Day 7)
    - Daily Available Time: 2.0 hours/day
    - Context: "Basic familiarity with Python, project not started. Deliver working prototype, tests, documentation."
  - Using relative project days for the sample project ensures the demo (completing Day 1, slipping Day 2, and replanning) is reproducible on any calendar day.
  - Clicking "Generate Plan" deterministically parses inputs, generates 8–10 realistic tasks grouped into 3 milestones, runs the scheduling algorithm, and stores the plan in `localStorage`.
- **Acceptance Criteria:**
  - [ ] Clicking "Try Sample Project" populates all fields without automatically saving or navigating.
  - [ ] Sample project operates on relative project days (Day 1 to Day 7) so the demo behaves identically on any real-world date.
  - [ ] Submitting empty required fields displays inline validation errors.
  - [ ] Generating the sample plan produces tasks that strictly fit within the 2-hour daily capacity limit.

### 2. Daily Execution and Task Cards
- Source: `scope.md > The Core Loop (2)`.
- **Behavior:**
  - Each task card displays:
    - Checkbox to toggle completion.
    - Title and short actionable description.
    - Estimated effort in hours/minutes (e.g., "1.5h").
    - Priority tag (High, Medium, Low).
    - Parent milestone pill.
    - Dependency badges: displays prerequisite task names; shows "Blocked" badge if prerequisites remain incomplete.
    - Expandable section for testable completion criterion.
  - Toggling a checkbox immediately updates task status (`completed` vs. `pending`), recalculates dashboard progress counters, and persists to local storage.
  - Completed tasks cannot cause dependency blocks for downstream tasks.
- **Acceptance Criteria:**
  - [ ] Checking a task marks it completed visually (strike/check, green badge) and updates progress percentage immediately.
  - [ ] Refreshing the browser preserves all completed states, schedule allocations, and revision records.
  - [ ] Tasks with incomplete prerequisites clearly show a blocked indicator.

### 3. Deterministic Scheduling and Feasibility Engine
- Source: `scope.md > The Unique Kernel`.
- **Behavior:**
  - Orders tasks using topological sort based on declared dependencies.
  - Allocates tasks sequentially into day buckets starting from Day 1.
  - A day bucket cannot exceed declared daily capacity (e.g., 2.0 hours).
  - A task is never scheduled on a day earlier than its prerequisites.
  - **Comprehensive Feasibility Standard:** A plan is feasible if and only if all incomplete tasks can be placed on days before the deadline without violating daily capacity or dependency order. If total hours fit but a dependency chain forces a task beyond the deadline, the engine explicitly reports infeasibility and identifies the conflicting task.
- **Acceptance Criteria:**
  - [ ] No task is ever scheduled on a day prior to any of its dependencies.
  - [ ] Sum of task durations scheduled on any day never exceeds daily hours limit.
  - [ ] Over-capacity or dependency-lagged tasks are honestly flagged as unscheduled rather than crammed into days.
  - [ ] Feasibility engine reports infeasibility if dependency delays push work past deadline, even if aggregate remaining hours are less than total remaining capacity.

### 4. Replan Review and Recovery Options
- Source: `scope.md > The Unique Kernel`, `scope.md > What "Working" Looks Like`.
- **Behavior:**
  - Triggered by "Replan" button.
  - Default review view evaluates the plan under current constraints, displaying remaining effort vs. capacity, net shortfall, and a schedule diff table:
    - Task name.
    - Original scheduled day vs. Proposed new day.
    - Status change (Unchanged, Moved, Blocked, Unscheduled).
  - Completed tasks on previous days are strictly preserved and never rescheduled.
  - When infeasible, offers 3 explicit recovery solutions:
    1. **Increase Daily Availability:** Recalculates schedule preview using increased daily hours.
    2. **Extend Deadline:** Recalculates schedule preview using extended project days.
    3. **Reduce Scope:** Proposes dropping specific lower-priority tasks. Explicitly identifies downstream dependent tasks, affected milestones, and modified completion criteria before confirmation.
  - Clicking "Cancel" closes modal with zero changes to active plan.
  - Clicking "Apply Revised Plan" commits the selected schedule, preserves completed task history, and writes a revision entry.
- **Acceptance Criteria:**
  - [ ] Default Replan Review displays exact shortfall and identifies unscheduled/conflicting tasks under current constraints.
  - [ ] Completed tasks from previous days are never moved, deleted, or marked pending by replanning.
  - [ ] Scope reduction explicitly lists affected dependent tasks, milestones, and success criteria, requiring user confirmation.
  - [ ] Selecting any recovery option updates the schedule diff preview to prove whether it resolves the shortfall.
  - [ ] Clicking "Cancel" leaves the active plan, task statuses, and revision history completely unchanged.
  - [ ] Clicking "Apply Revised Plan" updates the active schedule and records a new revision history entry.

### 5. Plan History and Reset
- Source: `scope.md > The POC Boundary`.
- **Behavior:**
  - App retains user-visible revision history (e.g., "Initial Plan", "Revision 1: Day 2 Slip Replan — 1 task moved, deadline extended +1 day").
  - "Start New Goal" button prompts user with a confirmation modal: "Starting a new goal will clear the current plan and history. Are you sure?"
  - Confirming clears local storage and returns user to the clean Goal Setup view.
- **Acceptance Criteria:**
  - [ ] Revision history accurately logs the reason, timestamp, and summary of changes each time a replan is applied.
  - [ ] Clicking "Start New Goal" requires explicit confirmation before clearing data.

---

## States and Boundaries

- **First Use State:** Opens directly to Goal Setup View with empty inputs and prominent "Try Sample Project" button.
- **Active Execution State:** Opens directly to Execution Dashboard showing current day, progress, schedule, and revision history.
- **Disrupted / Overdue State:** Displays amber banner when tasks are overdue or slippage occurs, prompting Replan.
- **Replan Review State:** In-memory calculation; active schedule is locked until user explicitly applies or cancels.
- **Infeasible Plan State:** Explicit shortfall / dependency conflict displayed with 3 recovery choices.
- **Completed Goal State:** 100% tasks completed with summary metrics and celebration state.
- **Persistence Boundary:** All state saved in browser `localStorage`. No external network requests, accounts, or cookies required.

---

## Product Decisions

- **Comprehensive Feasibility Standard:** Feasibility requires valid schedule placement respecting dependencies and daily limits, not merely an aggregate hours calculation.
- **Relative Project Days for Sample:** The sample scenario uses Day 1 to Day 7 rather than fixed calendar dates to ensure the demo is always reproducible.
- **Three Recovery Solutions:** Increase hours, extend deadline, reduce scope. "Maintain current constraints" is the default diagnostic view, not a recovery solution.
- **Scope Reduction Safety:** Lower-priority task cuts must detail downstream impact on dependencies and milestone completion criteria.
- **Replan-Driven Adjustments:** Daily availability and deadline edits occur through the Replan Review flow rather than arbitrary field editing.
- **Lightweight Revision History:** Records each applied replan to ensure transparency and accountability.

---

## What We're Building

1. Goal Setup View with validated inputs and 1-click deterministic Sample Project pre-fill (relative Day 1–7).
2. Deterministic Scheduling & Feasibility Engine enforcing dependency chains and daily capacity limits.
3. Execution Dashboard featuring Today focus, Day-by-Day schedule view, milestone progress, and revision history.
4. Interactive Task Cards with completion toggle, effort counters, dependency badges, and expandable completion criteria.
5. Replan Review Modal with comprehensive feasibility breakdown, schedule diff, 3 validated recovery options, scope-reduction impact disclosure, and explicit apply/cancel actions.
6. Persistent Local Browser Storage preserving plan, execution state, and revision history across sessions.

---

## Deferred From the POC

- User Accounts & Cloud Sync
- External Calendar Sync (Google Calendar / iCal)
- Collaboration & Task Delegation
- Automated Timer / Pomodoro Tracker

---

## Non-Goals

- Will NOT be a freeform chatbot that generates unstructured text advice.
- Will NOT declare a plan feasible when dependency conflicts prevent task placement.
- Will NOT silently delete tasks or push deadlines without explicit user authorization.
- Will NOT require an account, login, or cloud backend to be fully functional.

---

## Open Questions

None for PRD. All user flows, layout, behaviors, feasibility rules, and recovery options have been defined and agreed upon. Technical architecture, component layout, and data models will be resolved in `4-spec`.
