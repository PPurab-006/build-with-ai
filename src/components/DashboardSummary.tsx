'use client';

import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Target, Calendar, Clock, CheckCircle2, Zap, RotateCcw } from 'lucide-react';

interface DashboardSummaryProps {
  onOpenReplan: () => void;
}

export default function DashboardSummary({ onOpenReplan }: DashboardSummaryProps) {
  const { state, dispatch } = usePlanner();

  if (!state.goal) return null;

  const activeTasks = state.tasks.filter((t) => t.status !== 'dropped');
  const completedTasks = activeTasks.filter((t) => t.status === 'completed');
  const totalEffort = activeTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to start a new goal? Current execution progress will be reset.')) {
      dispatch({ type: 'RESET_GOAL' });
    }
  };

  return (
    <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-8">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Target className="w-3.5 h-3.5" />
              Active Goal
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {state.goal.isRelativeDays ? 'Relative Project Mode' : 'Calendar Mode'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900" id="goal-title-header">
            {state.goal.title}
          </h1>

          {state.goal.constraints && (
            <p className="text-xs text-slate-500 max-w-2xl line-clamp-1">
              <strong className="text-slate-600">Constraints:</strong> {state.goal.constraints}
            </p>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={onOpenReplan}
            id="btn-replan-header"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <Zap className="w-4 h-4 text-indigo-200" />
            Replan
          </button>

          <button
            type="button"
            onClick={handleReset}
            id="btn-new-goal"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Start New Goal
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {/* Progress Metric */}
        <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block mb-1">Overall Progress</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {state.overallProgressPercent || 0}%
            </span>
            <span className="text-xs text-slate-500">
              ({completedTasks.length}/{activeTasks.length} tasks)
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${state.overallProgressPercent || 0}%` }}
            />
          </div>
        </div>

        {/* Duration / Countdown Metric */}
        <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block mb-1">Timeline</span>
          <div className="flex items-baseline gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              Day {state.currentDay}
            </span>
            <span className="text-xs text-slate-500">
              of {state.goal.totalDays}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            {state.goal.totalDays - state.currentDay} day(s) remaining
          </span>
        </div>

        {/* Daily Capacity Limit */}
        <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block mb-1">Daily Capacity</span>
          <div className="flex items-baseline gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {state.goal.dailyHours}h
            </span>
            <span className="text-xs text-slate-500">/ day</span>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            Target daily commitment
          </span>
        </div>

        {/* Workload Remaining */}
        <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block mb-1">Effort Remaining</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {state.remainingEffortHours ?? totalEffort}h
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              of {totalEffort}h total
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-2 block tabular-nums">
            {state.completedEffortHours || 0}h completed
          </span>
        </div>
      </div>
    </header>
  );
}
