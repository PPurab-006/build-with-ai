import { generateSchedule, hasCyclicDependencies } from '../lib/engine';
import { Task, Goal } from '../lib/types';

describe('Planning Engine', () => {
  const goal: Goal = {
    id: 'g1',
    description: 'Test Goal',
    deadline: '2027-01-01',
    availableHoursPerDay: 4,
    currentProgress: '',
    constraints: ''
  };

  const tasks: Task[] = [
    { id: '1', title: 'Task 1', description: '', estimatedEffortHours: 2, dependencies: [], status: 'pending' },
    { id: '2', title: 'Task 2', description: '', estimatedEffortHours: 3, dependencies: ['1'], status: 'pending' },
    { id: '3', title: 'Task 3', description: '', estimatedEffortHours: 2, dependencies: ['2'], status: 'pending' },
  ];

  it('detects cyclic dependencies', () => {
    const cyclicTasks: Task[] = [
      { id: '1', title: 'Task 1', description: '', estimatedEffortHours: 2, dependencies: ['2'], status: 'pending' },
      { id: '2', title: 'Task 2', description: '', estimatedEffortHours: 3, dependencies: ['1'], status: 'pending' },
    ];
    expect(hasCyclicDependencies(cyclicTasks)).toBe(true);
    expect(hasCyclicDependencies(tasks)).toBe(false);
  });

  it('schedules tasks within time limits', () => {
    const schedule = generateSchedule(tasks, goal, new Date('2026-10-15T00:00:00Z'));
    expect(Object.keys(schedule.tasksByDate).length).toBe(3);
    expect(schedule.tasksByDate['2026-10-15'].map(t => t.id)).toEqual(['1']);
    expect(schedule.tasksByDate['2026-10-16'].map(t => t.id)).toEqual(['2']);
    expect(schedule.tasksByDate['2026-10-17'].map(t => t.id)).toEqual(['3']);
  });

  it('detects conflicts when schedule exceeds deadline', () => {
    const tightGoal = { ...goal, deadline: '2026-10-16' };
    const schedule = generateSchedule(tasks, tightGoal, new Date('2026-10-15T00:00:00Z'));
    expect(schedule.conflict).toContain('Try increasing daily available hours');
  });

  it('ignores completed tasks as blockers', () => {
    const mixedTasks: Task[] = [
      { id: '1', title: 'Task 1', description: '', estimatedEffortHours: 2, dependencies: [], status: 'completed' },
      { id: '2', title: 'Task 2', description: '', estimatedEffortHours: 3, dependencies: ['1'], status: 'pending' },
    ];
    const schedule = generateSchedule(mixedTasks, goal, new Date('2026-10-15T00:00:00Z'));
    expect(Object.keys(schedule.tasksByDate).length).toBe(1);
    expect(schedule.tasksByDate['2026-10-15'].map(t => t.id)).toEqual(['2']);
  });

  it('handles empty task list correctly', () => {
    const schedule = generateSchedule([], goal, new Date('2026-10-15T00:00:00Z'));
    expect(Object.keys(schedule.tasksByDate).length).toBe(0);
    expect(schedule.overdueTasks.length).toBe(0);
    expect(schedule.unassignedTasks.length).toBe(0);
    expect(schedule.conflict).toBeUndefined();
  });

  it('identifies overdue tasks accurately', () => {
    const mixedTasks: Task[] = [
      { id: '1', title: 'Overdue Task', description: '', estimatedEffortHours: 2, dependencies: [], status: 'pending', scheduledDate: '2026-10-14' },
      { id: '2', title: 'Future Task', description: '', estimatedEffortHours: 3, dependencies: ['1'], status: 'pending' },
    ];
    const schedule = generateSchedule(mixedTasks, goal, new Date('2026-10-15T00:00:00Z'));

    expect(schedule.overdueTasks.length).toBe(1);
    expect(schedule.overdueTasks[0].id).toBe('1');
    expect(schedule.tasksByDate['2026-10-15'].map(t => t.id)).toEqual(['1']);
    expect(schedule.tasksByDate['2026-10-16'].map(t => t.id)).toEqual(['2']);
  });

  it('handles complex dependency structures correctly', () => {
    const complexTasks: Task[] = [
      { id: '1', title: 'A', description: '', estimatedEffortHours: 1, dependencies: [], status: 'pending' },
      { id: '2', title: 'B', description: '', estimatedEffortHours: 2, dependencies: ['1'], status: 'pending' },
      { id: '3', title: 'C', description: '', estimatedEffortHours: 2, dependencies: ['1'], status: 'pending' },
      { id: '4', title: 'D', description: '', estimatedEffortHours: 1, dependencies: ['2', '3'], status: 'pending' },
    ];
    const schedule = generateSchedule(complexTasks, goal, new Date('2026-10-15T00:00:00Z'));
    expect(Object.keys(schedule.tasksByDate).length).toBe(2);
    expect(schedule.tasksByDate['2026-10-15'].map(t => t.id)).toEqual(['1', '2']);
    expect(schedule.tasksByDate['2026-10-16'].map(t => t.id)).toEqual(['3', '4']);
  });
});
