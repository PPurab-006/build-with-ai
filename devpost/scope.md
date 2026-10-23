---
doc: scope
status: approved
---
# Scope

## The Unique Kernel
A goal-to-execution planner that refuses to lie to you about time. It turns a vague ambition into a structured plan constrained by actual time available and deadlines. When tasks are missed or capacity changes, it replans honestly, preserving history, dependencies, and surfacing conflicts instead of silently moving deadlines or dropping requirements.

## The Core Loop
1. **Create Goal:** User inputs goal, deadline, available time/day, constraints, progress.
2. **Generate Plan:** Application generates (using AI if available, else deterministic template) milestones and tasks with explicit effort, dependencies, and completion criteria, validating against time budget.
3. **Execution & Daily Workspace:** User sees today's tasks, marks them complete, and adjusts progress.
4. **Adaptive Replanning:** If tasks are missed or time changes, user triggers a replan. The app recalculates remaining effort and reallocates time, explicitly highlighting conflicts or overloaded days.

## What "Working" Looks Like
A user can enter a sample goal, receive a valid structured plan, check off some tasks, deliberately miss others to simulate reality, and request a replan. The replan must demonstrably preserve completed work, shift pending tasks while respecting dependencies, and flag if the new timeline exceeds the deadline given daily time limits. Everything is testable in a quick 1-2 minute demo.

## The POC Boundary
- Single user (no authentication needed).
- Local or simple browser storage (no full backend DB required).
- Minimal AI integration for initial task breakdown, but with strong deterministic parsing and scheduling logic.
- UI focused strictly on planning, daily list, and replanning alerts. No generic chat, complex dashboards, or mobile-specific native app.
- Deterministic invariants (no cyclic dependencies, proper scheduling) must be tested.

## Explicitly Cut
- Multi-user collaboration.
- External calendar syncing.
- Mobile native app.
- Complex analytics.
- Paid APIs that are hard to run locally.
