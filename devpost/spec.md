---
doc: spec
status: approved
---
# Technical Specification

## How This Works, In Plain Language
The user enters their goal into a frontend web application. This data is sent to a basic generation service (using a mocked deterministic fallback for the PoC, or a free/cheap AI API call via serverless function) which returns a structured JSON list of tasks, dependencies, and effort. The frontend takes this JSON and runs a deterministic scheduling algorithm to map tasks to calendar days, respecting dependencies and daily time limits. The resulting schedule and task state are saved in the browser's LocalStorage. When the user updates tasks or asks for a replan, the frontend re-runs the deterministic scheduling on the remaining pending tasks and updates LocalStorage. The UI is built with React/Next.js for quick development.

## Where It Runs and How Someone Tries It
- **Run**: Local development server (`npm run dev` or `bun run dev`).
- **Try**: Open `http://localhost:3000` in a browser. Click the "Sample Goal" button, generate a plan, and interact with the daily view and replanning tool.

## Stack & Dependencies
- **Framework**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS, Shadcn UI (for quick, clean components).
- **Storage**: Browser `localStorage` (via custom React hooks or Zustand).
- **AI/Generation**: A serverless API route in Next.js that wraps an AI call (e.g., OpenAI or Anthropic SDK if configured, else fallback to deterministic JSON).

## Components and Architecture

### 1. Storage & State (`spec.md > Storage & State`)
- Implements persistence for Goals, Tasks, Milestones, and Schedule.
- A central state manager (Zustand or context) to handle CRUD operations on tasks.

### 2. The Planning Engine (`spec.md > The Planning Engine`)
- A deterministic TypeScript module containing logic to:
  - Validate dependencies (prevent cycles).
  - Allocate tasks to calendar days based on daily time limits.
  - Calculate remaining effort.
  - Identify scheduling conflicts.
- This is the core logic that ensures the constraints are met.

### 3. UI: Goal Form (`spec.md > UI: Goal Form`)
- Implements `prd.md > Goal Form`.
- A simple page/component capturing inputs and handling validation.

### 4. UI: Daily Execution View (`spec.md > UI: Daily Execution View`)
- Implements `prd.md > Daily Execution`.
- Shows today's schedule, overdue tasks, and milestone progress.

### 5. UI: Replanning View (`spec.md > UI: Replanning View`)
- Implements `prd.md > Replanning Engine`.
- A modal or dedicated page showing the delta between current state and proposed new schedule.

## Annotated File Structure
\`\`\`
/
├── devpost/                  # Required planning documents
├── src/
│   ├── app/                  # Next.js App Router (pages & API routes)
│   │   ├── api/generate/     # API endpoint for plan generation
│   │   ├── page.tsx          # Main dashboard/daily view
│   │   ├── plan/             # Goal creation and replanning flow
│   ├── components/           # UI Components (Forms, Task lists, UI lib)
│   ├── lib/
│   │   ├── engine.ts         # Deterministic scheduling & validation logic
│   │   ├── store.ts          # Zustand store for localStorage persistence
│   │   ├── types.ts          # TypeScript interfaces (Task, Schedule, etc.)
│   ├── tests/                # Unit tests for the engine and validation
\`\`\`

## Decisions and Open Issues
- **Decision**: No real backend database. Everything lives in `localStorage` to keep the PoC simple and perfectly fit within the 2-4 hour active work limit.
- **Open Issue**: How robust should the mock AI response be? *Resolution*: It should cover at least one deep scenario (e.g., "Build a personal portfolio website in 2 weeks at 2 hours/day") with realistic dependencies.
