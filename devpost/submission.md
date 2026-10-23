# Project Submission

## Inspiration
I wanted to build a planning tool for solo builders and students that doesn't just generate a naive list of to-dos, but actually schedules them against realistic constraints (time available per day) and allows for replanning when things slip without silently ignoring the deadline.

## What it does
It takes a goal, a deadline, and the number of hours you have available per day. It generates a task list (using a mocked AI endpoint to demonstrate how it would integrate with a LLM) with effort estimates and dependencies. Then, its core deterministic scheduling engine allocates these tasks to days, explicitly calling out conflicts if the plan is impossible. When you fall behind, you can hit "Replan" to reschedule your remaining work.

## How we built it
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **State:** Zustand with LocalStorage persistence for a lightweight, database-free execution.
- **Scheduling Engine:** A custom deterministic engine written in TypeScript using Kahn's algorithm for topological sorting to ensure task dependencies are never violated, while accumulating effort to ensure daily capacity isn't exceeded.

## Challenges we ran into
Handling the replanning logic. When a user misses a task, the engine has to separate completed tasks from pending ones, correctly identify overdue tasks, and then re-run the topological sort and daily allocation algorithm just on the remaining work without mutating the history of completed tasks.

## Accomplishments that we're proud of
The pure TypeScript scheduling engine that has zero dependencies other than `date-fns`. It's fully unit-tested to handle cyclic dependencies, time capacity limits, empty task lists, and deadline conflicts.

## What we learned
I reinforced the pattern of using deterministic logic to strictly validate and process non-deterministic LLM output.

## What's next for Planner
Connecting the `api/generate` route to a real LLM like Anthropic Claude or OpenAI GPT-4, and adding recurring calendar syncs.
