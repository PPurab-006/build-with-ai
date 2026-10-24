'use client';

import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import TaskCard from './TaskCard';
import { Clock, Calendar, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface TodayFocusProps {
  onOpenReplan?: () => void;
}

export default function TodayFocus({ onOpenReplan }: TodayFocusProps) {
  const { state, dispatch } = usePlanner();

  if (!state.goal) return null;

  const currentDay = state.currentDay;
  const totalDays = state.goal.totalDays;
  const dailyCapacity = state.goal.dailyHours;

  // Find today's schedule bucket
  const todaySchedule = state.schedule.find((s) => s.dayNumber === currentDay);
  const todayTasks = state.tasks.filter((t) => todaySchedule?.taskIds.includes(t.id));

  // Calculate today's workload
  const todayPlannedHours = todayTasks
    .filter((t) => t.status !== 'dropped')
    .reduce((sum, t) => sum + t.estimatedHours, 0);

  const todayCompletedHours = todayTasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.estimatedHours, 0);

  const capacityPercent = Math.min(100, Math.round((todayPlannedHours / dailyCapacity) * 100));
  const isOverCapacity = todayPlannedHours > dailyCapacity;

  // Find overdue tasks from previous days (< currentDay) that are still incomplete
  const overdueTasks = state.tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'dropped' &&
      t.scheduledDay !== undefined &&
      t.scheduledDay < currentDay
  );

  const handleDayChange = (newDay: number) => {
    if (newDay >= 1 && newDay <= totalDays) {
      dispatch({ type: 'SET_CURRENT_DAY', payload: { day: newDay } });
    }
  };

  const allTodayCompleted = todayTasks.length > 0 && todayTasks.every((t) => t.status === 'completed');

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-8">
      {/* Day Selector and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            D{currentDay}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Today's Focus: Day {currentDay} of {totalDays}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Active Execution
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Focus on today's allocated tasks to maintain continuous project momentum.
            </p>
          </div>
        </div>

        {/* Day Navigation Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => handleDayChange(currentDay - 1)}
            disabled={currentDay <= 1}
            id="btn-prev-day"
            title="Previous Day"
            className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold px-2 text-slate-700 tabular-nums">
            Day {currentDay}
          </span>

          <button
            type="button"
            onClick={() => handleDayChange(currentDay + 1)}
            disabled={currentDay >= totalDays}
            id="btn-next-day"
            title="Next Day"
            className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily Capacity Meter */}
      <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Today's Workload:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {todayPlannedHours}h planned
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 tabular-nums">{dailyCapacity}h daily capacity</span>
          </div>

          <div className="font-semibold tabular-nums">
            {isOverCapacity ? (
              <span className="text-rose-600">Capacity Exceeded ({capacityPercent}%)</span>
            ) : (
              <span className="text-indigo-700">{capacityPercent}% capacity utilized</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverCapacity
                ? 'bg-rose-500'
                : capacityPercent > 80
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, capacityPercent)}%` }}
          />
        </div>
      </div>

      {/* Overdue Warning Alert */}
      {overdueTasks.length > 0 && (
        <div className="mt-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs sm:text-sm font-semibold text-amber-900">
                {overdueTasks.length} task(s) from earlier days remain incomplete!
              </span>
              <p className="text-xs text-amber-800 mt-0.5">
                {overdueTasks.map((t) => `"${t.title}" (Day ${t.scheduledDay})`).join(', ')}.
                Prerequisites may block downstream work.
              </p>
            </div>
          </div>

          {onOpenReplan && (
            <button
              type="button"
              onClick={onOpenReplan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors shrink-0 shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-700" />
              Replan Schedule
            </button>
          )}
        </div>
      )}

      {/* Today's Tasks List */}
      <div className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Today's Scheduled Tasks ({todayTasks.length})
        </h3>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No tasks scheduled for Day {currentDay}</p>
            <p className="text-xs text-slate-400 mt-1">Enjoy the open time, or check earlier days for overdue items.</p>
          </div>
        ) : allTodayCompleted ? (
          <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-bold">All Day {currentDay} tasks completed!</div>
              <div className="text-xs text-emerald-700 mt-0.5">
                Outstanding progress! You have completed {todayCompletedHours}h of planned work today. Advance to Day {Math.min(totalDays, currentDay + 1)} when ready.
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {todayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              allTasks={state.tasks}
              milestones={state.milestones}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
