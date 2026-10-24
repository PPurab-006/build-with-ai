import { describe, it, expect } from 'vitest';
import { plannerReducer, initialPlannerState } from '../src/context/PlannerContext';
import { getSampleGoal, getSampleMilestones, getSampleTasks } from '../src/lib/sampleData';
import {
  generateInitialSchedule,
  computeReplanPreview,
  allocateTasksToDays,
  evaluateFeasibility,
} from '../src/lib/engine';
import { Task, PlannerState } from '../src/types/planner';

describe('Replan Review Workflow & Invariants', () => {
  const goal = getSampleGoal();
  const milestones = getSampleMilestones();
  const tasks = getSampleTasks();
  const scheduleResult = generateInitialSchedule(goal, tasks);

  // Initialize active plan
  const activePlanState = plannerReducer(initialPlannerState, {
    type: 'INITIALIZE_PLAN',
    payload: {
      goal,
      milestones,
      tasks: scheduleResult.tasks,
      schedule: scheduleResult.schedule,
    },
  });

  // Simulate Day 1 completed, Day 2 missed (currentDay = 3)
  const stateAtDay1 = plannerReducer(activePlanState, {
    type: 'TOGGLE_TASK_COMPLETION',
    payload: { taskId: 'task-1' },
  });

  const stateAtDay3WithMissedTask = plannerReducer(stateAtDay1, {
    type: 'SET_CURRENT_DAY',
    payload: { day: 3 },
  });

  it('in-memory preview calculation is 100% pure and does not mutate active state', () => {
    const stateSnapshotBefore = JSON.stringify(stateAtDay3WithMissedTask);

    const preview = computeReplanPreview(stateAtDay3WithMissedTask);

    expect(preview).toBeDefined();
    expect(preview.diffs.length).toBeGreaterThan(0);
    expect(preview.recoveryOptions.length).toBe(3);

    // Verify active state was not mutated at all
    expect(JSON.stringify(stateAtDay3WithMissedTask)).toBe(stateSnapshotBefore);
    expect(stateAtDay3WithMissedTask.revisionHistory.length).toBe(1); // Only initial plan entry
  });

  it('accurately identifies multi-factor feasibility and bottleneck on Day 3 disruption', () => {
    const preview = computeReplanPreview(stateAtDay3WithMissedTask);

    // Feasibility is false because 6 sequential tasks cannot fit into 5 remaining days
    expect(preview.report.isFeasible).toBe(false);
    expect(preview.report.unscheduledTaskIds).toContain('task-9');
    expect(
      preview.report.diagnostics.some((d) => d.type === 'DEPENDENCY_BOTTLENECK')
    ).toBe(true);

    // Completed Task 1 remains unchanged on Day 1
    const task1Diff = preview.diffs.find((d) => d.taskId === 'task-1');
    expect(task1Diff?.changeType).toBe('unchanged');
    expect(task1Diff?.proposedDay).toBe(1);

    // Missed Task 2 is moved to Day 3
    const task2Diff = preview.diffs.find((d) => d.taskId === 'task-2');
    expect(task2Diff?.changeType).toBe('moved');
    expect(task2Diff?.proposedDay).toBe(3);
  });

  it('evaluates all 3 validated recovery options with honest feasibility', () => {
    const preview = computeReplanPreview(stateAtDay3WithMissedTask);

    const optIncreaseHours = preview.recoveryOptions.find((o) => o.type === 'increase_hours');
    const optExtendDeadline = preview.recoveryOptions.find((o) => o.type === 'extend_deadline');
    const optReduceScope = preview.recoveryOptions.find((o) => o.type === 'reduce_scope');

    expect(optIncreaseHours).toBeDefined();
    // Honest: increasing hours alone cannot squeeze 6 sequential days into 5 days
    expect(optIncreaseHours?.isFeasible).toBe(false);

    expect(optExtendDeadline).toBeDefined();
    // Extending deadline by 1 day allows all 6 sequential tasks to fit
    expect(optExtendDeadline?.isFeasible).toBe(true);
    expect(optExtendDeadline?.proposedParameter).toBe(8); // Extends to Day 8

    expect(optReduceScope).toBeDefined();
    expect(optReduceScope?.affectedMilestones).toBeDefined();
  });

  it('applying revision commits schedule, updates tasks, and appends to revision history', () => {
    const preview = computeReplanPreview(stateAtDay3WithMissedTask);
    const extendOpt = preview.recoveryOptions.find((o) => o.type === 'extend_deadline')!;

    // Allocate tasks with extended deadline (Day 8)
    const completedMap = new Map<string, number>([['task-1', 1]]);
    const revisedAllocation = allocateTasksToDays(
      stateAtDay3WithMissedTask.tasks,
      goal.dailyHours,
      8, // Extended to 8 days
      3, // Starting from Day 3
      completedMap
    );

    const revisedState = plannerReducer(stateAtDay3WithMissedTask, {
      type: 'APPLY_REVISION',
      payload: {
        revisedSchedule: revisedAllocation.schedule,
        revisedTasks: revisedAllocation.scheduledTasks,
        reason: 'Extended deadline by 1 day to resolve dependency bottleneck',
        summary: 'Added Day 8; shifted downstream tasks to accommodate missed Day 2 work.',
      },
    });

    // Verify revision history contains exactly 2 entries (initial + revision)
    expect(revisedState.revisionHistory.length).toBe(2);
    const latestRev = revisedState.revisionHistory[0];
    expect(latestRev.revisionNumber).toBe(2);
    expect(latestRev.reason).toContain('Extended deadline');
    expect(latestRev.tasksShiftedCount).toBeGreaterThan(0);

    // Verify task-9 is now validly scheduled on Day 8
    const task9 = revisedState.tasks.find((t) => t.id === 'task-9');
    expect(task9?.scheduledDay).toBe(8);
  });
});
