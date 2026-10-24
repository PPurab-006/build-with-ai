'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import {
  PlannerState,
  Goal,
  Milestone,
  Task,
  DaySchedule,
  RevisionHistoryEntry,
} from '../types/planner';
import { loadPlannerState, savePlannerState, clearPlannerState } from '../lib/storage';

export type PlannerAction =
  | { type: 'INIT_SAVED_STATE'; payload: PlannerState }
  | {
      type: 'INITIALIZE_PLAN';
      payload: {
        goal: Goal;
        milestones: Milestone[];
        tasks: Task[];
        schedule: DaySchedule[];
      };
    }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string } }
  | {
      type: 'APPLY_REVISION';
      payload: {
        revisedSchedule: DaySchedule[];
        revisedTasks: Task[];
        reason: string;
        summary: string;
      };
    }
  | { type: 'SET_CURRENT_DAY'; payload: { day: number } }
  | { type: 'RESET_GOAL' };

export const initialPlannerState: PlannerState = {
  goal: null,
  milestones: [],
  tasks: [],
  schedule: [],
  currentDay: 1,
  overallProgressPercent: 0,
  completedEffortHours: 0,
  remainingEffortHours: 0,
  revisionHistory: [],
};

export function calculateProgressMetrics(tasks: Task[]) {
  const activeTasks = tasks.filter((t) => t.status !== 'dropped');
  const completedTasks = activeTasks.filter((t) => t.status === 'completed');

  const totalEffort = activeTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const completedEffort = completedTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const remainingEffort = Math.round((totalEffort - completedEffort) * 100) / 100;
  const progressPercent = totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;

  return {
    completedEffortHours: Math.round(completedEffort * 100) / 100,
    remainingEffortHours: Math.max(0, remainingEffort),
    overallProgressPercent: progressPercent,
  };
}

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'INIT_SAVED_STATE': {
      return {
        ...action.payload,
      };
    }

    case 'INITIALIZE_PLAN': {
      const { goal, milestones, tasks, schedule } = action.payload;
      const metrics = calculateProgressMetrics(tasks);

      return {
        goal,
        milestones,
        tasks,
        schedule,
        currentDay: 1,
        ...metrics,
        revisionHistory: [
          {
            id: `rev-init-${Date.now()}`,
            revisionNumber: 1,
            timestamp: new Date().toISOString(),
            reason: 'Initial plan generated',
            tasksShiftedCount: 0,
            tasksDroppedCount: 0,
            summary: `Initial plan generated for "${goal.title}" across ${goal.totalDays} days (${goal.dailyHours}h/day).`,
          },
        ],
      };
    }

    case 'TOGGLE_TASK_COMPLETION': {
      const targetTask = state.tasks.find((t) => t.id === action.payload.taskId);
      if (!targetTask) return state;

      const newStatus = targetTask.status === 'completed' ? 'pending' : 'completed';
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === action.payload.taskId) {
          return {
            ...t,
            status: newStatus as Task['status'],
            completedOnDay: newStatus === 'completed' ? state.currentDay : undefined,
          };
        }
        return t;
      });

      const metrics = calculateProgressMetrics(updatedTasks);

      return {
        ...state,
        tasks: updatedTasks,
        ...metrics,
      };
    }

    case 'APPLY_REVISION': {
      const { revisedSchedule, revisedTasks, reason, summary } = action.payload;

      // Count tasks shifted vs dropped compared to current state
      let shiftedCount = 0;
      let droppedCount = 0;

      for (const revTask of revisedTasks) {
        const origTask = state.tasks.find((t) => t.id === revTask.id);
        if (revTask.status === 'dropped' && origTask?.status !== 'dropped') {
          droppedCount++;
        } else if (origTask && origTask.scheduledDay !== revTask.scheduledDay) {
          shiftedCount++;
        }
      }

      const newHistoryEntry: RevisionHistoryEntry = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        revisionNumber: state.revisionHistory.length + 1,
        timestamp: new Date().toISOString(),
        reason,
        tasksShiftedCount: shiftedCount,
        tasksDroppedCount: droppedCount,
        summary,
      };

      const metrics = calculateProgressMetrics(revisedTasks);

      return {
        ...state,
        tasks: revisedTasks,
        schedule: revisedSchedule,
        revisionHistory: [newHistoryEntry, ...state.revisionHistory],
        lastReplanTimestamp: newHistoryEntry.timestamp,
        ...metrics,
      };
    }

    case 'SET_CURRENT_DAY': {
      return {
        ...state,
        currentDay: Math.max(1, Math.min(state.goal?.totalDays || 7, action.payload.day)),
      };
    }

    case 'RESET_GOAL': {
      clearPlannerState();
      return initialPlannerState;
    }

    default:
      return state;
  }
}

interface PlannerContextType {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
  isHydrated: boolean;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(plannerReducer, initialPlannerState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Rehydrate state on client-side mount
  useEffect(() => {
    try {
      const saved = loadPlannerState();
      if (saved) {
        dispatch({ type: 'INIT_SAVED_STATE', payload: saved });
      }
    } catch (err) {
      console.error('[PlannerContext] Error during state rehydration:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync state to localStorage whenever state changes after initial hydration
  useEffect(() => {
    if (isHydrated && state.goal) {
      savePlannerState(state);
    }
  }, [state, isHydrated]);

  return (
    <PlannerContext.Provider value={{ state, dispatch, isHydrated }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner(): PlannerContextType {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}
