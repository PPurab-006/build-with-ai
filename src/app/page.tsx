'use client';

import React from 'react';
import { PlannerProvider, usePlanner } from '../context/PlannerContext';
import GoalSetup from '../components/GoalSetup';
import { Calendar, Clock, CheckCircle2, RotateCcw } from 'lucide-react';

function PlannerApp() {
  const { state, dispatch, isHydrated } = usePlanner();

  // Guard against SSR hydration mismatches
  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-sm">
        Initializing planner...
      </div>
    );
  }

  // If no goal is configured, render the Goal Setup view
  if (!state.goal) {
    return <GoalSetup />;
  }

  // Active Goal View (Slice 2 persistence proof & bridge to Slice 3 Dashboard)
  return (
    <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Active Plan Initialized & Persisted
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="active-goal-title">
              {state.goal.title}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              {state.goal.context}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset current goal and return to setup?')) {
                dispatch({ type: 'RESET_GOAL' });
              }
            }}
            id="btn-reset-goal"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Goal
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Duration</span>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>{state.goal.totalDays} Days</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Daily Capacity</span>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="tabular-nums">{state.goal.dailyHours}h / day</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Total Tasks</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              <span className="tabular-nums">{state.tasks.length} tasks</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Total Workload</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              <span className="tabular-nums">
                {state.tasks.reduce((sum, t) => sum + t.estimatedHours, 0)}h
              </span>
            </div>
          </div>
        </div>

        {/* Schedule preview list */}
        <div className="mt-8">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            Initial Deterministic Schedule ({state.schedule.length} Days)
          </h2>
          <div className="space-y-3">
            {state.schedule.map((day) => {
              const dayTasks = state.tasks.filter((t) => day.taskIds.includes(t.id));
              return (
                <div
                  key={day.dayNumber}
                  className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Day {day.dayNumber}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {dayTasks.length > 0
                          ? dayTasks.map((t) => t.title).join(', ')
                          : 'No tasks scheduled'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {dayTasks.length} task(s) allocated
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                      {day.allocatedHours}h / {day.capacityHours}h capacity
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <PlannerProvider>
      <PlannerApp />
    </PlannerProvider>
  );
}
