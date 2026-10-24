import { describe, it, expect } from 'vitest';
import {
  plannerReducer,
  initialPlannerState,
  calculateProgressMetrics,
} from '../src/context/PlannerContext';
import { Goal, Milestone, Task, DaySchedule } from '../src/types/planner';
import { getSampleGoal, getSampleMilestones, getSampleTasks } from '../src/lib/sampleData';
import { generateInitialSchedule } from '../src/lib/engine';

describe('Planner Reducer — State Transitions & Invariants', () => {
  const sampleGoal: Goal = getSampleGoal();
  const sampleMilestones: Milestone[] = getSampleMilestones();
  const sampleTasks: Task[] = getSampleTasks();
  const scheduleResult = generateInitialSchedule(sampleGoal, sampleTasks);

  it('initializes plan state and records initial revision entry', () => {
    const nextState = plannerReducer(initialPlannerState, {
      type: 'INITIALIZE_PLAN',
      payload: {
        goal: sampleGoal,
        milestones: sampleMilestones,
        tasks: scheduleResult.tasks,
        schedule: scheduleResult.schedule,
      },
    });

    expect(nextState.goal).toEqual(sampleGoal);
    expect(nextState.tasks.length).toBe(sampleTasks.length);
    expect(nextState.currentDay).toBe(1);
    expect(nextState.overallProgressPercent).toBe(0);
    expect(nextState.completedEffortHours).toBe(0);
    expect(nextState.remainingEffortHours).toBe(
      sampleTasks.reduce((sum, t) => sum + t.estimatedHours, 0)
    );
    expect(nextState.revisionHistory.length).toBe(1);
    expect(nextState.revisionHistory[0].reason).toBe('Initial plan generated');
  });

  it('toggles task completion and assigns completedOnDay immutably', () => {
    const initState = plannerReducer(initialPlannerState, {
      type: 'INITIALIZE_PLAN',
      payload: {
        goal: sampleGoal,
        milestones: sampleMilestones,
        tasks: scheduleResult.tasks,
        schedule: scheduleResult.schedule,
      },
    });

    const targetTaskId = 'task-1';
    const task1Effort = sampleTasks.find((t) => t.id === targetTaskId)!.estimatedHours;

    // Toggle complete on Day 1
    const completedState = plannerReducer(initState, {
      type: 'TOGGLE_TASK_COMPLETION',
      payload: { taskId: targetTaskId },
    });

    const completedTask = completedState.tasks.find((t) => t.id === targetTaskId);
    expect(completedTask?.status).toBe('completed');
    expect(completedTask?.completedOnDay).toBe(1);
    expect(completedState.completedEffortHours).toBe(task1Effort);
    expect(completedState.overallProgressPercent).toBeGreaterThan(0);

    // Toggle back to pending
    const pendingState = plannerReducer(completedState, {
      type: 'TOGGLE_TASK_COMPLETION',
      payload: { taskId: targetTaskId },
    });

    const pendingTask = pendingState.tasks.find((t) => t.id === targetTaskId);
    expect(pendingTask?.status).toBe('pending');
    expect(pendingTask?.completedOnDay).toBeUndefined();
    expect(pendingState.completedEffortHours).toBe(0);
    expect(pendingState.overallProgressPercent).toBe(0);
  });

  it('applies confirmed revision and logs to revisionHistory with diff counts', () => {
    const initState = plannerReducer(initialPlannerState, {
      type: 'INITIALIZE_PLAN',
      payload: {
        goal: sampleGoal,
        milestones: sampleMilestones,
        tasks: scheduleResult.tasks,
        schedule: scheduleResult.schedule,
      },
    });

    // Simulate revised tasks where task-2 moves to Day 3 and task-7 is dropped
    const revisedTasks = initState.tasks.map((t) => {
      if (t.id === 'task-2') return { ...t, scheduledDay: 3 };
      if (t.id === 'task-7') return { ...t, status: 'dropped' as const };
      return { ...t };
    });

    const revisedState = plannerReducer(initState, {
      type: 'APPLY_REVISION',
      payload: {
        revisedSchedule: initState.schedule,
        revisedTasks,
        reason: 'Missed task-2 deadline on Day 2',
        summary: 'Rescheduled task-2 to Day 3; dropped low-priority task-7.',
      },
    });

    expect(revisedState.revisionHistory.length).toBe(2); // 1 initial + 1 revision
    const latestRevision = revisedState.revisionHistory[0];
    expect(latestRevision.reason).toBe('Missed task-2 deadline on Day 2');
    expect(latestRevision.tasksShiftedCount).toBe(1);
    expect(latestRevision.tasksDroppedCount).toBe(1);
    expect(revisedState.lastReplanTimestamp).toBeDefined();
  });

  it('resets goal completely to initial state', () => {
    const activeState = plannerReducer(initialPlannerState, {
      type: 'INITIALIZE_PLAN',
      payload: {
        goal: sampleGoal,
        milestones: sampleMilestones,
        tasks: scheduleResult.tasks,
        schedule: scheduleResult.schedule,
      },
    });

    const resetState = plannerReducer(activeState, { type: 'RESET_GOAL' });
    expect(resetState.goal).toBeNull();
    expect(resetState.tasks).toEqual([]);
    expect(resetState.schedule).toEqual([]);
    expect(resetState.revisionHistory).toEqual([]);
  });
});
