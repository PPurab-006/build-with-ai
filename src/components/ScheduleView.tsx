'use client';

import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import TaskCard from './TaskCard';
import { Calendar, AlertCircle } from 'lucide-react';

export default function ScheduleView() {
  const { state } = usePlanner();

  if (!state.goal || !state.schedule) return null;

  const currentDay = state.currentDay;
  const dailyCapacity = state.goal.dailyHours;

  // Find unscheduled or dropped tasks
  const unscheduledTasks = state.tasks.filter((t) => t.scheduledDay === undefined && t.status !== 'dropped');
  const droppedTasks = state.tasks.filter((t) => t.status === 'dropped');

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Day-by-Day Execution Plan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic schedule respecting daily hour capacity and sequential dependency ordering.
          </p>
        </div>

        <span className="text-xs text-slate-500 font-medium self-start sm:self-auto bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          {state.schedule.length} Day Horizon
        </span>
      </div>

      {/* Days Grid/List */}
      <div className="space-y-6">
        {state.schedule.map((day) => {
          const isToday = day.dayNumber === currentDay;
          const dayTasks = state.tasks.filter((t) => day.taskIds.includes(t.id));
          const isOverCapacity = day.allocatedHours > dailyCapacity;
          const allCompleted = dayTasks.length > 0 && dayTasks.every((t) => t.status === 'completed');

          return (
            <div
              key={day.dayNumber}
              className={`rounded-xl border transition-all ${
                isToday
                  ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/10'
                  : allCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Day Header */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-t-xl border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-bold text-xs px-2.5 py-1 rounded-md ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : allCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    Day {day.dayNumber}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {day.dateLabel}
                  </span>

                  {isToday && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Today
                    </span>
                  )}

                  {allCompleted && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  )}
                </div>

                {/* Capacity utilization tag */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Workload:</span>
                  <span
                    className={`font-bold tabular-nums px-2 py-0.5 rounded ${
                      isOverCapacity
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {day.allocatedHours}h / {day.capacityHours}h capacity
                  </span>
                </div>
              </div>

              {/* Day Tasks Body */}
              <div className="p-3.5 sm:p-4">
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No tasks scheduled for Day {day.dayNumber}.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        allTasks={state.tasks}
                        milestones={state.milestones}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled or Dropped Tasks Section (if any) */}
      {(unscheduledTasks.length > 0 || droppedTasks.length > 0) && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Unscheduled & Dropped Items ({unscheduledTasks.length + droppedTasks.length})
            </h3>
          </div>

          <div className="space-y-3">
            {unscheduledTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                allTasks={state.tasks}
                milestones={state.milestones}
              />
            ))}

            {droppedTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg bg-slate-100 border border-dashed border-slate-300 opacity-70 flex items-center justify-between text-xs text-slate-500"
              >
                <div>
                  <span className="font-semibold line-through text-slate-600">{task.title}</span>
                  <span className="ml-2 text-rose-600 font-medium">(Scope Reduced / Dropped)</span>
                </div>
                <span className="tabular-nums">{task.estimatedHours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
