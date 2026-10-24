---
doc: scope
status: approved
---

# Adaptive Execution Planner (Working Title)

A practical, honest goal-to-execution planner for students and independent builders that turns ambitious ambitions into feasible daily schedules and adapts when life gets in the way.

## The Unique Kernel
Honest adaptive replanning with deterministic recovery proposals. When tasks are missed or daily availability changes, the engine recalculates the schedule using deterministic capacity allocation and dependency constraints. It never silently drops tasks, fakes progress, or pushes deadlines without permission: it preserves completed history, highlights schedule changes, explains mathematical shortfalls (remaining effort vs. remaining capacity), and offers explicit recovery proposals (increasing daily hours, extending the deadline, or dropping a lower-priority task) that the user must explicitly choose and confirm.

## Who It's For
Students and solo builders working on self-directed projects, coursework, research, or personal hackathon builds. They often have high motivation but variable daily capacity, and struggle when a single missed day cascades into an abandoned plan because existing tools are either rigid checklists or ungrounded chatbots.

## The Core Loop
1. **Define & Generate:** User enters a goal, deadline, daily hours, and constraints. The planner produces a structured plan with milestones, tasks, dependencies, and daily allocations.
2. **Execute & Track:** User works through the daily view, marking tasks complete and logging actual progress.
3. **Disrupt & Replan:** When an interruption happens or a task is missed, user triggers "Replan". The engine redistributes remaining work, presents the schedule diff, and alerts to any deadline shortfalls.
4. **Resolve & Iterate:** If infeasible, the engine explains the exact shortfall and presents explicit recovery options. The user selects a recovery option (or accepts the shortfall), confirms the revised plan, and continues execution with history preserved.

## Inspiration & Identity
- **Tone:** Calm, focused, transparent, and encouraging without false optimism.
- **Aesthetic:** Clean, intentional layout prioritizing readability, clear schedule hierarchy, and visual diffs for replanned work.
- **Visual Identity:** Intentionally undecided for now; will be refined during PRD.

## Why This Matters to the Learner
To move beyond optimistic, ungrounded planning tools and build a system that reflects how real work happens: with setbacks, tight constraints, and the need for honest mathematical recalculation rather than hallucinated reassurance.

## What "Working" Looks Like
A realistic, 2-minute end-to-end demo:
1. **Goal Input:** Enter "Build and submit a working machine-learning project in 7 days", 2 hours/day available.
2. **Initial Plan:** App generates milestones (prototype, testing, docs), concrete tasks with estimated effort, dependency links, and a strict 2-hour daily allocation.
3. **Execution:** User marks Day 1 tasks complete.
4. **Disruption:** On Day 2, a task is missed due to unexpected lost time.
5. **Adaptive Replan:** User clicks "Replan". App recalculates remaining work against remaining days/hours.
6. **The "Oh, that's cool" Moment:** The app displays the updated schedule, preserves Day 1's completed record, highlights the exact shifts, explains the exact capacity shortfall, and presents concrete recovery choices (e.g., extend deadline, increase daily hours, or drop lowest-priority task) showing their impact before user confirmation.

## The POC Boundary
- **In Scope:**
  - Single end-to-end goal planning and execution journey.
  - Structured plan generation (milestones, tasks, effort, dependencies, completion conditions).
  - Deterministic scheduling and replanning engine (respects daily hours and dependency order).
  - Daily execution tracking (mark tasks complete, record progress).
  - Interactive replan trigger with schedule diff, history preservation, and shortfall explanation.
  - Deterministic recovery option proposals (extend deadline, add daily hours, drop lowest-priority task) requiring explicit user confirmation.
  - Persistent local browser storage.
  - Modular, testable core engine.

## Later
- Multi-goal concurrent scheduling.
- External calendar integration (Google Calendar, iCal).
- Live cloud synchronization and automated reminders.
- Dynamic task splitting and subtask time-tracking timers.

## Explicitly Cut
- **User Accounts and Authentication:** Unnecessary friction for proving the core planning/replanning mechanic in a PoC.
- **Team Collaboration & Sharing:** Focus is squarely on solo builders and students.
- **Push Notifications & Background Alerts:** Distraction from the core algorithmic and execution engine.
- **Complex Analytics & Reporting Dashboards:** Replaced by straightforward progress tracking and schedule diffs.
