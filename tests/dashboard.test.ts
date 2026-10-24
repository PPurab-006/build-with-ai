import { describe, it, expect } from 'vitest';
import { plannerReducer, initialPlannerState } from '../src/context/PlannerContext';
import { getSampleGoal, getSampleMilestones, getSampleTasks } from '../src/lib/sampleData';
import { generateInitialSchedule } from '../src/lib/engine';
import { Task } from '../src/types/planner';

describe('Execution Dashboard & Task Management Workflow', () => {
  const goal = getSampleGoal();
  const milestones = getSampleMilestones();
  const tasks = getSampleTasks();
  const scheduleResult = generateInitialSchedule(goal, tasks);

  const activePlanState = plannerReducer(initialPlannerState, {
    type: 'INITIALIZE_PLAN',
    payload: {
      goal,
      milestones,
      tasks: scheduleResult.tasks,
      schedule: scheduleResult.schedule,
    },
  });

  it('completing Day 1 task updates metrics and unblocks Day 2 prerequisite', () => {
    // Before completing task-1, task-2 has incomplete prerequisite [task-1]
    const task2Before = activePlanState.tasks.find((t) => t.id === 'task-2')!;
    const prereqBefore = activePlanState.tasks.find((t) => t.id === 'task-1')!;
    expect(prereqBefore.status).toBe('pending');

    // Complete task-1 on Day 1
    const stateAfterDay1 = plannerReducer(activePlanState, {
      type: 'TOGGLE_TASK_COMPLETION',
      payload: { taskId: 'task-1' },
    });

    const task1After = stateAfterDay1.tasks.find((t) => t.id === 'task-1')!;
    expect(task1After.status).toBe('completed');
    expect(task1After.completedOnDay).toBe(1);
    expect(stateAfterDay1.completedEffortHours).toBe(task1After.estimatedHours);
    expect(stateAfterDay1.overallProgressPercent).toBeGreaterThan(0);

    // Verify task-2's prerequisite task-1 is now completed
    const incompletePrereqsForTask2 = task2Before.dependencies
      .map((depId) => stateAfterDay1.tasks.find((t) => t.id === depId))
      .filter((t): t is Task => t !== undefined && t.status !== 'completed');

    expect(incompletePrereqsForTask2.length).toBe(0); // All prerequisites are finished!
  });

  it('day navigation updates currentDay within goal boundaries', () => {
    // Advance from Day 1 to Day 2
    const day2State = plannerReducer(activePlanState, {
      type: 'SET_CURRENT_DAY',
      payload: { day: 2 },
    });
    expect(day2State.currentDay).toBe(2);

    // Advance to Day 7
    const day7State = plannerReducer(day2State, {
      type: 'SET_CURRENT_DAY',
      payload: { day: 7 },
    });
    expect(day7State.currentDay).toBe(7);

    // Attempting to exceed bounds clamps to totalDays
    const clampedMaxState = plannerReducer(day7State, {
      type: 'SET_CURRENT_DAY',
      payload: { day: 99 },
    });
    expect(clampedMaxState.currentDay).toBe(7);

    // Attempting negative or 0 clamps to 1
    const clampedMinState = plannerReducer(day7State, {
      type: 'SET_CURRENT_DAY',
      payload: { day: 0 },
    });
    expect(clampedMinState.currentDay).toBe(1);
  });

  it('identifies overdue tasks when advancing days without completing tasks', () => {
    // Complete task-1 on Day 1
    const stateAtDay1 = plannerReducer(activePlanState, {
      type: 'TOGGLE_TASK_COMPLETION',
      payload: { taskId: 'task-1' },
    });

    // Advance to Day 3 without completing task-2 (which was scheduled for Day 2)
    const stateAtDay3 = plannerReducer(stateAtDay1, {
      type: 'SET_CURRENT_DAY',
      payload: { day: 3 },
    });

    expect(stateAtDay3.currentDay).toBe(3);

    // Tasks scheduled on Day 2 that are still incomplete are overdue on Day 3
    const overdue = stateAtDay3.tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'dropped' &&
        t.scheduledDay !== undefined &&
        t.scheduledDay < stateAtDay3.currentDay
    );

    expect(overdue.some((t) => t.id === 'task-2')).toBe(true);
    expect(overdue.find((t) => t.id === 'task-1')).toBeUndefined(); // task-1 is completed, so not overdue
  });
});
