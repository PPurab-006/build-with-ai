import { describe, it, expect } from 'vitest';
import {
  validateTaskInputs,
  allocateTasksToDays,
  evaluateFeasibility,
  generateInitialSchedule,
  computeReplanPreview,
  getDownstreamDependencies,
} from '../src/lib/engine';
import { getSampleGoal, getSampleMilestones, getSampleTasks } from '../src/lib/sampleData';
import { Task, PlannerState } from '../src/types/planner';

describe('Scheduling Engine — Input Validation', () => {
  it('detects duplicate task IDs', () => {
    const tasks: Task[] = [
      {
        id: 'dup-1',
        title: 'Task A',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1,
        priority: 'medium',
        dependencies: [],
        completionCriterion: 'done',
        status: 'pending',
      },
      {
        id: 'dup-1',
        title: 'Task B',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1,
        priority: 'medium',
        dependencies: [],
        completionCriterion: 'done',
        status: 'pending',
      },
    ];

    const result = validateTaskInputs(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.type === 'INVALID_INPUT' && e.message.includes('Duplicate'))).toBe(true);
  });

  it('rejects zero, negative, or non-finite effort estimates', () => {
    const tasks: Task[] = [
      {
        id: 't-zero',
        title: 'Zero Effort',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 0,
        priority: 'medium',
        dependencies: [],
        completionCriterion: 'done',
        status: 'pending',
      },
      {
        id: 't-neg',
        title: 'Negative Effort',
        description: '',
        milestoneId: 'm1',
        estimatedHours: -2,
        priority: 'medium',
        dependencies: [],
        completionCriterion: 'done',
        status: 'pending',
      },
      {
        id: 't-nan',
        title: 'NaN Effort',
        description: '',
        milestoneId: 'm1',
        estimatedHours: NaN,
        priority: 'medium',
        dependencies: [],
        completionCriterion: 'done',
        status: 'pending',
      },
    ];

    const result = validateTaskInputs(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
    expect(result.errors.every((e) => e.type === 'INVALID_INPUT')).toBe(true);
  });

  it('detects non-existent dependency references', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        title: 'Task 1',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1,
        priority: 'medium',
        dependencies: ['ghost-id'],
        completionCriterion: 'done',
        status: 'pending',
      },
    ];

    const result = validateTaskInputs(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('non-existent dependency'))).toBe(true);
  });

  it('detects circular dependencies (cycles)', () => {
    const tasks: Task[] = [
      {
        id: 'a',
        title: 'Task A',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1,
        priority: 'medium',
        dependencies: ['b'],
        completionCriterion: 'done',
        status: 'pending',
      },
      {
        id: 'b',
        title: 'Task B',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1,
        priority: 'medium',
        dependencies: ['c'],
        completionCriterion: 'done',
        status: 'pending',
      },
      {
        id: 'c',
        title: 'Task C',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1,
        priority: 'medium',
        dependencies: ['a'], // cycle: a -> b -> c -> a
        completionCriterion: 'done',
        status: 'pending',
      },
    ];

    const result = validateTaskInputs(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.type === 'CYCLE_DETECTED')).toBe(true);
    expect(result.cycle).toBeDefined();
    expect(result.cycle).toContain('a');
    expect(result.cycle).toContain('b');
    expect(result.cycle).toContain('c');
  });
});

describe('Scheduling Engine — Deterministic Allocation & Invariants', () => {
  it('enforces that no task is scheduled before or on the day of its incomplete prerequisite', () => {
    const goal = getSampleGoal();
    const tasks = getSampleTasks();
    const result = generateInitialSchedule(goal, tasks);

    expect(result.feasibility.isFeasible).toBe(true);

    const taskDayMap = new Map<string, number>();
    for (const t of result.tasks) {
      if (t.scheduledDay !== undefined) {
        taskDayMap.set(t.id, t.scheduledDay);
      }
    }

    for (const t of result.tasks) {
      const scheduledDay = taskDayMap.get(t.id);
      expect(scheduledDay).toBeDefined();

      for (const depId of t.dependencies) {
        const depDay = taskDayMap.get(depId);
        expect(depDay).toBeDefined();
        // A task must be scheduled on a strictly later day than its prerequisite
        expect(scheduledDay).toBeGreaterThan(depDay!);
      }
    }
  });

  it('never exceeds the configured daily capacity on any day', () => {
    const goal = getSampleGoal();
    const tasks = getSampleTasks();
    const result = generateInitialSchedule(goal, tasks);

    for (const day of result.schedule) {
      expect(day.allocatedHours).toBeLessThanOrEqual(day.capacityHours);
    }
  });

  it('is completely deterministic: identical input produces identical day-by-day schedules', () => {
    const goal = getSampleGoal();
    const tasks = getSampleTasks();

    const run1 = generateInitialSchedule(goal, tasks);
    const run2 = generateInitialSchedule(goal, tasks);

    expect(run1.schedule).toEqual(run2.schedule);
    expect(run1.tasks.map((t) => t.scheduledDay)).toEqual(run2.tasks.map((t) => t.scheduledDay));
  });

  it('does not mutate input tasks during scheduling', () => {
    const tasks = getSampleTasks();
    const originalSnap = JSON.stringify(tasks);

    allocateTasksToDays(tasks, 2.0, 7);

    expect(JSON.stringify(tasks)).toBe(originalSnap);
  });
});

describe('Scheduling Engine — Comprehensive Feasibility Diagnostics', () => {
  it('flags OVERSIZED_TASK when a task exceeds daily capacity', () => {
    const tasks: Task[] = [
      {
        id: 't-huge',
        title: 'Huge Task',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 4.0, // exceeds 2h daily capacity
        priority: 'high',
        dependencies: [],
        completionCriterion: 'done',
        status: 'pending',
      },
    ];

    const report = evaluateFeasibility(tasks, 2.0, 7);
    expect(report.isFeasible).toBe(false);
    expect(report.diagnostics.some((d) => d.type === 'OVERSIZED_TASK')).toBe(true);
    expect(report.unscheduledTaskIds).toContain('t-huge');
  });

  it('detects DEPENDENCY_BOTTLENECK when total hours fit but sequential prerequisite chain pushes work past deadline', () => {
    // 3 tasks of 1 hour each = 3 hours total.
    // Daily capacity = 2.0h, Total days = 2 days (4 hours capacity).
    // Total hours (3h) < Available capacity (4h).
    // BUT t1 must be on Day 1, t2 on Day 2, and t3 is forced to Day 3 (past the 2-day deadline)!
    const tasks: Task[] = [
      {
        id: 'seq-1',
        title: 'Seq 1',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1.0,
        priority: 'high',
        dependencies: [],
        completionCriterion: 'done',
        status: 'pending',
      },
      {
        id: 'seq-2',
        title: 'Seq 2',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1.0,
        priority: 'high',
        dependencies: ['seq-1'],
        completionCriterion: 'done',
        status: 'pending',
      },
      {
        id: 'seq-3',
        title: 'Seq 3',
        description: '',
        milestoneId: 'm1',
        estimatedHours: 1.0,
        priority: 'high',
        dependencies: ['seq-2'],
        completionCriterion: 'done',
        status: 'pending',
      },
    ];

    const report = evaluateFeasibility(tasks, 2.0, 2);
    // Even though 3h effort < 4h capacity, seq-3 cannot be placed before Day 2 deadline!
    expect(report.isFeasible).toBe(false);
    expect(report.unscheduledTaskIds).toContain('seq-3');
    expect(report.diagnostics.some((d) => d.type === 'DEPENDENCY_BOTTLENECK')).toBe(true);
  });
});

describe('Scheduling Engine — Replanning & Recovery Proposals', () => {
  it('correctly calculates downstream dependency impact for scope reduction', () => {
    const tasks = getSampleTasks();
    // task-2 feeds into task-3 and task-6; task-3 feeds into task-4 and task-7, etc.
    const downstreamOfTask2 = getDownstreamDependencies('task-2', tasks);
    expect(downstreamOfTask2).toContain('task-3');
    expect(downstreamOfTask2).toContain('task-4');
    expect(downstreamOfTask2).toContain('task-5');
    expect(downstreamOfTask2).toContain('task-6');
    expect(downstreamOfTask2).toContain('task-7');
    expect(downstreamOfTask2).toContain('task-8');
    expect(downstreamOfTask2).toContain('task-9');
  });

  it('runs the full realistic 7-day ML project demo scenario', () => {
    const goal = getSampleGoal();
    const milestones = getSampleMilestones();
    const tasks = getSampleTasks();

    // 1. Initial Schedule is feasible
    const initial = generateInitialSchedule(goal, tasks);
    expect(initial.feasibility.isFeasible).toBe(true);
    expect(initial.unscheduledTasks.length).toBe(0);

    // 2. Day 1 Completed: Task 1 marked complete on Day 1
    const tasksAfterDay1 = initial.tasks.map((t) =>
      t.id === 'task-1' ? { ...t, status: 'completed' as const, completedOnDay: 1 } : t
    );

    const stateAtDay2: PlannerState = {
      goal,
      milestones,
      tasks: tasksAfterDay1,
      schedule: initial.schedule,
      currentDay: 2,
      revisionHistory: [],
    };

    // 3. Day 2 Disruption: Task 2 is missed!
    // User moves to Day 3 with Task 2 still incomplete.
    // Days remaining = Day 3 to Day 7 = 5 days * 2h = 10h capacity.
    // Incomplete tasks remaining: task-2 (1.5) + task-3 (2.0) + task-4 (1.0) + task-5 (1.5)
    // + task-6 (1.0) + task-7 (1.5) + task-8 (1.5) + task-9 (0.5) = 10.5 hours!
    // Result: 10.5h effort vs 10h capacity -> 0.5h capacity shortfall!
    const stateAtDay3WithMissedTask: PlannerState = {
      ...stateAtDay2,
      currentDay: 3,
    };

    const replanPreview = computeReplanPreview(stateAtDay3WithMissedTask);

    // Feasibility is false because the 6-step sequential dependency chain pushes Task 9 past Day 7
    expect(replanPreview.report.isFeasible).toBe(false);
    expect(replanPreview.report.unscheduledTaskIds).toContain('task-9');
    expect(replanPreview.report.diagnostics.some((d) => d.type === 'DEPENDENCY_BOTTLENECK')).toBe(true);

    // Task 1 was completed on Day 1 and MUST remain unchanged on Day 1
    const task1Diff = replanPreview.diffs.find((d) => d.taskId === 'task-1');
    expect(task1Diff).toBeDefined();
    expect(task1Diff?.changeType).toBe('unchanged');
    expect(task1Diff?.proposedDay).toBe(1);

    // Verify recovery options were computed
    expect(replanPreview.recoveryOptions.length).toBe(3);

    const increaseHoursOpt = replanPreview.recoveryOptions.find((o) => o.type === 'increase_hours');
    const extendDeadlineOpt = replanPreview.recoveryOptions.find((o) => o.type === 'extend_deadline');
    const reduceScopeOpt = replanPreview.recoveryOptions.find((o) => o.type === 'reduce_scope');

    expect(increaseHoursOpt).toBeDefined();
    // In this scenario, the bottleneck is a sequential dependency chain (6 tasks across 5 remaining days).
    // Honest feasibility engine correctly reports that increasing daily hours alone does not solve the dependency bottleneck.
    expect(increaseHoursOpt?.isFeasible).toBe(false);

    expect(extendDeadlineOpt).toBeDefined();
    // Extending the deadline gives the required extra day for the sequential chain, resolving feasibility.
    expect(extendDeadlineOpt?.isFeasible).toBe(true);

    expect(reduceScopeOpt).toBeDefined();
    // Scope reduction must disclose downstream impact
    expect(reduceScopeOpt?.affectedMilestones).toBeDefined();
  });
});
