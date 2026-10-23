---
doc: prd
status: approved
---
# Product Requirements Document

## Core Journey
Implements `scope.md > The Core Loop`.

1. **Onboarding / Goal Creation**: A clear form capturing goal, target date, daily time, current progress, constraints. Includes a "Sample Goal" button to auto-fill for testing.
2. **Plan Generation**: A loading state while AI/generator creates the tasks. Result is a structured milestone and task list with effort, dependencies, and validation against capacity constraints.
3. **Daily Workspace**: The primary execution view. Shows tasks for the current day. Allows marking complete/incomplete.
4. **Replanning View**: Triggered on missed work or capacity change. Shows a preview of the new plan vs old plan, highlighting shifts and explicitly calling out deadline conflicts. User must confirm before applying.
5. **Progress Summary**: A simple visual indication of completed vs planned effort, remaining milestones, and risks to target date.

## Look and Feel
Calm, focused planning workspace. Clear hierarchy. Functional over flashy. Uses a clean, minimalist typography (e.g., Inter), lots of whitespace, and clear distinct colors for states (e.g., green for complete, red/orange for blocked or conflicting tasks). Empty, loading, and error states must be explicitly designed and clear.

## Behaviors and Acceptance Criteria

### Goal Form (`prd.md > Goal Form`)
- Fields: Goal description, Deadline (date), Available time (hours/day), Current Progress, Constraints.
- Validation: Deadline must be in the future. Time must be > 0.
- Sample data: A single click populates all fields with a realistic student/solo builder scenario.

### Plan Generation and Validation (`prd.md > Plan Generation`)
- Output must be structured into Milestones -> Tasks.
- Tasks must have clear deliverables/completion conditions, estimated effort (hours), dependencies, and order.
- The system must validate the generated plan: total effort must fit into available time before the deadline. If it doesn't, it displays an explicit warning.

### Daily Execution (`prd.md > Daily Execution`)
- Shows tasks assigned to 'today' based on the schedule.
- Tasks can be toggled Complete.
- Overdue tasks from previous days are clearly highlighted.

### Replanning Engine (`prd.md > Replanning Engine`)
- When invoked, recalculates remaining work.
- Completed tasks are immutable and stay in history.
- Re-runs scheduling logic for pending tasks respecting dependencies and time constraints.
- Previews changes and shows any unresolvable conflicts (e.g., "This plan now requires 3 hours/day but you only have 2, deadline missed by 5 days").
- Requires confirmation to save.

## Product Decisions
- The plan validation and scheduling is deterministic, operating on structured JSON output from an AI or fallback generator.
- "Today" is determined by local system time.

## Deferred
- Custom recurring tasks.
- Integrations with other tools.
