'use client';

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import DashboardSummary from './DashboardSummary';
import TodayFocus from './TodayFocus';
import MilestonesSummary from './MilestonesSummary';
import ScheduleView from './ScheduleView';
import { Zap, X, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ExecutionDashboard() {
  const { state } = usePlanner();
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);

  if (!state.goal) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Dashboard Summary */}
      <DashboardSummary onOpenReplan={() => setIsReplanModalOpen(true)} />

      {/* Today Focus Card (Dedicated day view with capacity meter) */}
      <TodayFocus onOpenReplan={() => setIsReplanModalOpen(true)} />

      {/* Milestones Overview */}
      <MilestonesSummary />

      {/* Day-by-Day Full Schedule */}
      <ScheduleView />

      {/* Replan Modal Stub (Slice 3 Preview / Bridge to Slice 4) */}
      {isReplanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Replan Execution</h3>
                  <p className="text-xs text-slate-500">Adaptive schedule recalculation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReplanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                <span className="font-semibold block mb-1">Slice 3 Execution Dashboard Active</span>
                You can mark Day 1 tasks complete, advance to Day 2 or 3 using the day selector, and inspect capacity meters and milestone progression.
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <span className="font-semibold text-slate-800 block">Upcoming in Slice 4:</span>
                <p>• Mathematical shortfall analysis (remaining effort vs. capacity)</p>
                <p>• Before-and-after schedule diff (moved, blocked, unscheduled)</p>
                <p>• 3 concrete recovery options (increase hours, extend deadline, reduce scope)</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsReplanModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
