'use client';

import React from 'react';
import { PlannerProvider, usePlanner } from '../context/PlannerContext';
import GoalSetup from '../components/GoalSetup';
import ExecutionDashboard from '../components/ExecutionDashboard';

function PlannerApp() {
  const { state, isHydrated } = usePlanner();

  // Guard against SSR hydration mismatches
  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] text-slate-400 text-sm">
        Initializing planner...
      </div>
    );
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
