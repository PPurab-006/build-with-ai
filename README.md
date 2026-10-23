# Practical Execution Planner PoC

This is a proof-of-concept goal-to-execution planning application built for the Build With AI: Basics hackathon. It transforms a vague ambition into a structured plan, strictly constrained by a target date and daily available hours.

It differentiates itself by running a deterministic scheduling algorithm on top of the generated task list, ensuring dependencies are respected and time capacity limits are enforced. If tasks are missed, a "Replan" feature recalculates the entire schedule, explicitly warning the user if the new schedule exceeds their deadline.

## Features
- **Goal Creation:** Enter a goal, deadline, and available hours per day.
- **Task Generation:** Mock AI endpoint generates structured tasks with effort estimates and dependencies.
- **Deterministic Scheduling:** A core engine allocates tasks to calendar days without violating daily hour limits or dependency order.
- **Daily View:** Execute tasks on a day-by-day basis.
- **Replanning Engine:** Reschedule remaining tasks when life gets in the way.

## Running the PoC Locally

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Setup
1. Clone the repository.
2. Install dependencies:
   \`npm install\`
3. Start the development server:
   \`npm run dev\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### How to test the core journey
1. On the landing page, click **"Sample Goal"** to auto-fill realistic values.
2. Click **"Generate Plan"**. (This uses a mocked endpoint for determinism).
3. You will be redirected to the **Daily Dashboard**. Here you can see tasks for today and any overdue tasks.
4. Complete a task by clicking its circle.
5. Click **"Replan"** in the top right to see how the system reschedules incomplete tasks.

## Testing the Engine
The core scheduling logic is tested independently of the UI.
\`npx jest src/tests/engine.test.ts\`

## Architecture
- **Frontend:** Next.js App Router, React, Tailwind CSS
- **State Management:** Zustand with `localStorage` persistence
- **Planning Logic:** Pure TypeScript module (\`src/lib/engine.ts\`)
