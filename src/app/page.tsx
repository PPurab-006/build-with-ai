'use client';

import React from 'react';
import { PlannerProvider, usePlanner } from '../context/PlannerContext';
import GoalSetup from '../components/GoalSetup';
import ExecutionDashboard from '../components/ExecutionDashboard';

function PlannerApp() {
  const { state, isHydrated } = usePlanner();

  // If not yet hydrated and no goal exists, render GoalSetup cleanly without trapping the user
  if (!isHydrated && !state.goal) {
    return <GoalSetup />;
  }

  // If no goal is configured, render Goal Setup
  if (!state.goal) {
    return <GoalSetup />;
  }

  // Active Execution Dashboard
  return <ExecutionDashboard />;
}

export default function Home() {
  return (
    <PlannerProvider>
      <main className="min-h-screen bg-slate-50">
        <PlannerApp />
      </main>
    </PlannerProvider>
  );
}
