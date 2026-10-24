'use client';

import React, { useState } from 'react';
import { Task, Milestone } from '../types/planner';
import { usePlanner } from '../context/PlannerContext';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, AlertTriangle, Lock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  milestones: Milestone[];
}

export default function TaskCard({ task, allTasks, milestones }: TaskCardProps) {
  const { dispatch } = usePlanner();
  const [isExpanded, setIsExpanded] = useState(false);

  const milestone = milestones.find((m) => m.id === task.milestoneId);

  // Check dependency status
  const incompletePrereqs = task.dependencies
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter((t): t is Task => t !== undefined && t.status !== 'completed');

  const isBlocked = incompletePrereqs.length > 0 && task.status !== 'completed';

  const handleToggle = () => {
    dispatch({
      type: 'TOGGLE_TASK_COMPLETION',
      payload: { taskId: task.id },
    });
  };

  const priorityStyles = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const isCompleted = task.status === 'completed';
  const isDropped = task.status === 'dropped';

  return (
    <div
      className={`rounded-lg border transition-all duration-150 ${
        isCompleted
          ? 'bg-slate-50/80 border-slate-200 opacity-80'
          : isDropped
          ? 'bg-slate-100 border-dashed border-slate-300 opacity-60'
          : isBlocked
          ? 'bg-white border-amber-200 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isDropped}
            aria-label={isCompleted ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
            className={`mt-0.5 shrink-0 focus:outline-none transition-colors ${
              isCompleted
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-slate-300 hover:text-indigo-600'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 fill-emerald-50" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {/* Priority badge */}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  priorityStyles[task.priority]
                }`}
              >
                {task.priority}
              </span>

              {/* Milestone badge */}
              {milestone && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[180px]">
                  {milestone.title}
                </span>
              )}

              {/* Blocked indicator */}
              {isBlocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Blocked by {incompletePrereqs.map((p) => p.title).join(', ')}
                </span>
              )}

              {/* Completed badge */}
              {isCompleted && task.completedOnDay && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Completed on Day {task.completedOnDay}
                </span>
              )}
            </div>

            <h4
              className={`text-sm font-semibold leading-snug break-words ${
                isCompleted ? 'line-through text-slate-500' : isDropped ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {task.title}
            </h4>

            {/* Effort & Toggle Details Row */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {task.estimatedHours}h effort
              </span>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none"
              >
                <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Description & Acceptance Criteria */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2.5 animate-fadeIn">
            {task.description && (
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Description</span>
                <p className="leading-relaxed">{task.description}</p>
              </div>
            )}

            {task.completionCriterion && (
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-800 block mb-0.5">
                  Completion Criterion
                </span>
                <p className="text-slate-600 leading-relaxed">{task.completionCriterion}</p>
              </div>
            )}

            {task.dependencies.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Prerequisites</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {task.dependencies.map((depId) => {
                    const depTask = allTasks.find((t) => t.id === depId);
                    return (
                      <li key={depId} className={depTask?.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}>
                        {depTask ? depTask.title : depId} ({depTask?.status || 'unknown'})
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
