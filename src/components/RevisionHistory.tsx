'use client';

import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { History, X, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RevisionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RevisionHistory({ isOpen, onClose }: RevisionHistoryProps) {
  const { state } = usePlanner();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Revision History</h3>
              <p className="text-xs text-slate-500">Immutable record of plan adaptations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {state.revisionHistory.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No revisions recorded yet.</p>
          ) : (
            state.revisionHistory.map((rev, index) => (
              <div
                key={rev.id || index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 relative"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Revision {rev.revisionNumber}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900">
                  {rev.reason}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {rev.summary}
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-4 text-[11px] text-slate-500">
                  <span>
                    Shifted: <strong className="text-slate-700 tabular-nums">{rev.tasksShiftedCount || 0}</strong>
                  </span>
                  <span>
                    Dropped: <strong className="text-slate-700 tabular-nums">{rev.tasksDroppedCount || 0}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-xs text-slate-500">
            Revisions are only created upon explicit user confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
