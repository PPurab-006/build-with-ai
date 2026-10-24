'use client';

import React, { useState, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  computeReplanPreview,
  allocateTasksToDays,
  evaluateFeasibility,
  getDownstreamDependencies,
} from '../lib/engine';
import {
  Task,
  DaySchedule,
  TaskDiff,
  RecoveryOptionPreview,
  FeasibilityReport,
} from '../types/planner';
import {
  Zap,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  TrendingUp,
  Scissors,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ReplanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReplanReviewModal({ isOpen, onClose }: ReplanReviewModalProps) {
  const { state, dispatch } = usePlanner();

  // Selected recovery option: null = baseline replan under existing constraints
  const [selectedRecoveryType, setSelectedRecoveryType] = useState<
    'increase_hours' | 'extend_deadline' | 'reduce_scope' | null
  >(null);

  // 1. Compute baseline replan preview in-memory (no mutation of active state)
  const baselinePreview = useMemo(() => {
    if (!state.goal) return null;
    return computeReplanPreview(state);
  }, [state]);

  // 2. Compute dynamic plan based on selected recovery option
  const activePlan = useMemo(() => {
    if (!state.goal || !baselinePreview) return null;

    // Completed tasks lookup
    const completedDayMap = new Map<string, number>();
    for (const t of state.tasks) {
      if (t.status === 'completed' && t.completedOnDay !== undefined) {
        completedDayMap.set(t.id, t.completedOnDay);
      }
    }

    if (!selectedRecoveryType) {
      return {
        schedule: baselinePreview.proposedSchedule,
        tasks: baselinePreview.proposedTasks,
        diffs: baselinePreview.diffs,
        report: baselinePreview.report,
        appliedGoalChanges: null,
        recoverySummary: 'Maintain existing schedule boundaries and daily capacity limit.',
      };
    }

    const recOption = baselinePreview.recoveryOptions.find((o) => o.type === selectedRecoveryType);

    if (selectedRecoveryType === 'increase_hours') {
      const newCapacity = typeof recOption?.proposedParameter === 'number' ? recOption.proposedParameter : state.goal.dailyHours + 1.0;
      const allocResult = allocateTasksToDays(
        state.tasks,
        newCapacity,
        state.goal.totalDays,
        state.currentDay,
        completedDayMap
      );
      const feasReport = evaluateFeasibility(
        allocResult.scheduledTasks,
        newCapacity,
        state.goal.totalDays,
        state.currentDay,
        completedDayMap
      );

      // Generate diffs
      const diffs: TaskDiff[] = allocResult.scheduledTasks.map((task) => {
        const orig = state.tasks.find((t) => t.id === task.id);
        const prevDay = orig?.scheduledDay;
        const proposedDay = task.scheduledDay;

        if (task.status === 'completed') {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'unchanged' };
        }
        if (!proposedDay) {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay: undefined, changeType: 'unscheduled', reason: 'Exceeds deadline' };
        }
        if (prevDay !== proposedDay) {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'moved', reason: `Shifted to Day ${proposedDay}` };
        }
        return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'unchanged' };
      });

      return {
        schedule: allocResult.schedule,
        tasks: allocResult.scheduledTasks,
        diffs,
        report: feasReport,
        appliedGoalChanges: { dailyHours: newCapacity },
        recoverySummary: `Increased daily capacity to ${newCapacity}h/day across remaining days.`,
      };
    }

    if (selectedRecoveryType === 'extend_deadline') {
      const newTotalDays = typeof recOption?.proposedParameter === 'number' ? recOption.proposedParameter : state.goal.totalDays + 1;
      const allocResult = allocateTasksToDays(
        state.tasks,
        state.goal.dailyHours,
        newTotalDays,
        state.currentDay,
        completedDayMap
      );
      const feasReport = evaluateFeasibility(
        allocResult.scheduledTasks,
        state.goal.dailyHours,
        newTotalDays,
        state.currentDay,
        completedDayMap
      );

      const diffs: TaskDiff[] = allocResult.scheduledTasks.map((task) => {
        const orig = state.tasks.find((t) => t.id === task.id);
        const prevDay = orig?.scheduledDay;
        const proposedDay = task.scheduledDay;

        if (task.status === 'completed') {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'unchanged' };
        }
        if (!proposedDay) {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay: undefined, changeType: 'unscheduled', reason: 'Exceeds extended deadline' };
        }
        if (prevDay !== proposedDay) {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'moved', reason: `Shifted to Day ${proposedDay}` };
        }
        return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'unchanged' };
      });

      return {
        schedule: allocResult.schedule,
        tasks: allocResult.scheduledTasks,
        diffs,
        report: feasReport,
        appliedGoalChanges: { totalDays: newTotalDays },
        recoverySummary: `Extended deadline by ${newTotalDays - state.goal.totalDays} day(s) to Day ${newTotalDays}.`,
      };
    }

    if (selectedRecoveryType === 'reduce_scope') {
      const droppedIds: string[] = Array.isArray(recOption?.proposedParameter)
        ? (recOption.proposedParameter as string[])
        : [];

      const reducedTasks = state.tasks.map((t) =>
        droppedIds.includes(t.id) ? { ...t, status: 'dropped' as const } : { ...t }
      );

      const allocResult = allocateTasksToDays(
        reducedTasks,
        state.goal.dailyHours,
        state.goal.totalDays,
        state.currentDay,
        completedDayMap
      );
      const feasReport = evaluateFeasibility(
        allocResult.scheduledTasks,
        state.goal.dailyHours,
        state.goal.totalDays,
        state.currentDay,
        completedDayMap
      );

      const diffs: TaskDiff[] = allocResult.scheduledTasks.map((task) => {
        const orig = state.tasks.find((t) => t.id === task.id);
        const prevDay = orig?.scheduledDay;
        const proposedDay = task.scheduledDay;

        if (task.status === 'dropped') {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay: undefined, changeType: 'dropped', reason: 'Dropped from scope' };
        }
        if (task.status === 'completed') {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'unchanged' };
        }
        if (!proposedDay) {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay: undefined, changeType: 'unscheduled', reason: 'Exceeds deadline' };
        }
        if (prevDay !== proposedDay) {
          return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'moved', reason: `Shifted to Day ${proposedDay}` };
        }
        return { taskId: task.id, taskTitle: task.title, previousDay: prevDay, proposedDay, changeType: 'unchanged' };
      });

      return {
        schedule: allocResult.schedule,
        tasks: allocResult.scheduledTasks,
        diffs,
        report: feasReport,
        appliedGoalChanges: null,
        recoverySummary: `Reduced scope: dropped ${droppedIds.length} task(s) to fit remaining capacity.`,
      };
    }

    return null;
  }, [state, baselinePreview, selectedRecoveryType]);

  if (!isOpen || !state.goal || !baselinePreview || !activePlan) return null;

  const handleApplyPlan = () => {
    const reasonText = selectedRecoveryType
      ? `Replan on Day ${state.currentDay}: Selected "${baselinePreview.recoveryOptions.find((o) => o.type === selectedRecoveryType)?.label || selectedRecoveryType}"`
      : `Replan on Day ${state.currentDay}: Recalculated under existing constraints`;

    dispatch({
      type: 'APPLY_REVISION',
      payload: {
        revisedSchedule: activePlan.schedule,
        revisedTasks: activePlan.tasks,
        reason: reasonText,
        summary: activePlan.recoverySummary,
      },
    });

    onClose();
  };

  const report = activePlan.report;
  const isFeasible = report.isFeasible;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-2xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Adaptive Replan Review
              </h2>
              <p className="text-xs text-slate-500">
                Mathematical feasibility evaluation and before-and-after schedule comparison
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="btn-close-replan-modal"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Feasibility Breakdown Banner */}
          <div
            className={`p-4 sm:p-5 rounded-xl border ${
              isFeasible
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {isFeasible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-bold text-sm">
                  {isFeasible ? 'Schedule is 100% Feasible' : 'Infeasible Under Current Constraints'}
                </span>
              </div>

              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isFeasible
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {isFeasible ? 'Feasible' : 'Bottleneck Detected'}
              </span>
            </div>

            {/* Mathematical Calculation Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-white/80 rounded-lg border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Remaining Work</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {report.remainingEffortHours}h effort
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Available Capacity</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {report.availableCapacityHours}h total
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Capacity Difference</span>
                <span
                  className={`font-bold tabular-nums ${
                    report.shortfallHours > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {report.shortfallHours > 0
                    ? `-${report.shortfallHours}h Shortfall`
                    : `+${Math.abs(report.availableCapacityHours - report.remainingEffortHours)}h Surplus`}
                </span>
              </div>
            </div>

            {/* Diagnostics Explanation */}
            {report.diagnostics.length > 0 && (
              <div className="mt-3 text-xs space-y-1">
                {report.diagnostics.map((diag, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-rose-900">
                    <span className="font-semibold shrink-0">• {diag.type}:</span>
                    <span>{diag.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3 Validated Recovery Options (Active when Infeasible or user wants to adapt) */}
          {(!isFeasible || selectedRecoveryType !== null) && baselinePreview.recoveryOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select a Validated Recovery Option
                </h3>
                <span className="text-[11px] text-slate-500">
                  Click an option to preview its impact on the schedule
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {baselinePreview.recoveryOptions.map((opt) => {
                  const isSelected = selectedRecoveryType === opt.type;

                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setSelectedRecoveryType(isSelected ? null : opt.type)}
                      className={`text-left p-4 rounded-xl border transition-all relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{opt.label}</span>
                            {opt.isFeasible ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Resolves Bottleneck
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                Insufficient Alone
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{opt.impactSummary}</p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule Diff Table (Before vs After) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Schedule Diff: Before vs. Proposed
              </h3>
              <span className="text-[11px] text-slate-500">
                {activePlan.diffs.filter((d) => d.changeType !== 'unchanged').length} changes proposed
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Task</th>
                    <th className="py-2.5 px-3.5">Previous</th>
                    <th className="py-2.5 px-3.5">Proposed</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePlan.diffs.map((diff) => {
                    const badgeStyles: Record<string, string> = {
                      unchanged: 'bg-slate-100 text-slate-600',
                      moved: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                      blocked: 'bg-amber-50 text-amber-700 border border-amber-200',
                      unscheduled: 'bg-rose-50 text-rose-700 border border-rose-200',
                      dropped: 'bg-slate-100 text-slate-500 line-through',
                    };

                    return (
                      <tr key={diff.taskId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                          {diff.taskTitle}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 tabular-nums">
                          {diff.previousDay ? `Day ${diff.previousDay}` : '—'}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900 tabular-nums">
                          {diff.proposedDay ? `Day ${diff.proposedDay}` : 'Unscheduled'}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              badgeStyles[diff.changeType] || 'bg-slate-100'
                            }`}
                          >
                            {diff.changeType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                          {diff.reason || 'On schedule'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            id="btn-cancel-replan"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Cancel (No Changes)
          </button>

          <button
            type="button"
            onClick={handleApplyPlan}
            id="btn-apply-replan"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply Revised Plan
          </button>
        </div>
      </div>
    </div>
  );
}
