'use client';

import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Flag, CheckCircle2 } from 'lucide-react';

export default function MilestonesSummary() {
  const { state } = usePlanner();

  if (!state.milestones || state.milestones.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-8">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Milestones & Target Dates
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {state.milestones.length} milestones defined
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.milestones.map((milestone) => {
          const milestoneTasks = state.tasks.filter((t) => t.milestoneId === milestone.id && t.status !== 'dropped');
          const completedCount = milestoneTasks.filter((t) => t.status === 'completed').length;
          const totalCount = milestoneTasks.length;
          const isComplete = totalCount > 0 && completedCount === totalCount;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div
              key={milestone.id}
              className={`p-4 rounded-lg border transition-all ${
                isComplete
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Target: Day {milestone.targetDay}
                </span>

                {isComplete && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Done
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-2">
                {milestone.title}
              </h4>

              {/* Progress bar and counter */}
              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="tabular-nums">
                    {completedCount} of {totalCount} task{totalCount === 1 ? '' : 's'}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-700">{percent}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
