import { Task, Goal, Schedule } from './types';
import { addDays, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';

export function hasCyclicDependencies(tasks: Task[]): boolean {
  const adjacencyList = new Map<string, string[]>();
  tasks.forEach(t => adjacencyList.set(t.id, t.dependencies || []));

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string): boolean {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const deps = adjacencyList.get(node) || [];
    for (const dep of deps) {
      if (dfs(dep)) return true;
    }

    recStack.delete(node);
    return false;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      if (dfs(t.id)) return true;
    }
  }

  return false;
}

export function generateSchedule(
  tasks: Task[],
  goal: Goal,
  startDate: Date = new Date()
): Schedule {
  if (hasCyclicDependencies(tasks)) {
    throw new Error('Cyclic dependencies detected in tasks.');
  }

  const tasksByDate: Record<string, Task[]> = {};
  const overdueTasks: Task[] = [];
  const unassignedTasks: Task[] = [];

  const pendingTasks = tasks
    .filter(t => t.status !== 'completed')
    .map(t => ({ ...t }));

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completedTaskIds = new Set(completedTasks.map(t => t.id));

  const startDay = startOfDay(startDate);
  pendingTasks.forEach(t => {
    if (t.scheduledDate && isBefore(parseISO(t.scheduledDate), startDay)) {
      overdueTasks.push(t);
    }
  });

  const tasksToSchedule = [...pendingTasks];

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  tasksToSchedule.forEach(t => {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  });

  tasksToSchedule.forEach(t => {
    t.dependencies.forEach(depId => {
      if (completedTaskIds.has(depId)) return;

      if (inDegree.has(depId) && inDegree.has(t.id)) {
        adj.get(depId)!.push(t.id);
        inDegree.set(t.id, inDegree.get(t.id)! + 1);
      }
    });
  });

  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  let currentDate = startDay;
  let hoursUsedToday = 0;
  let conflict: string | undefined;

  const deadlineDate = startOfDay(parseISO(goal.deadline));

  while (queue.length > 0) {
    const taskId = queue.shift()!;
    const taskIndex = tasksToSchedule.findIndex(t => t.id === taskId);
    const task = tasksToSchedule[taskIndex];

    if (hoursUsedToday + task.estimatedEffortHours > goal.availableHoursPerDay && hoursUsedToday > 0) {
      currentDate = addDays(currentDate, 1);
      hoursUsedToday = 0;
    }

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    task.scheduledDate = dateStr;

    if (!tasksByDate[dateStr]) {
      tasksByDate[dateStr] = [];
    }
    tasksByDate[dateStr].push(task);

    hoursUsedToday += task.estimatedEffortHours;

    const neighbors = adj.get(taskId) || [];
    for (const n of neighbors) {
      const deg = inDegree.get(n)! - 1;
      inDegree.set(n, deg);
      if (deg === 0) {
        queue.push(n);
      }
    }
  }

  tasksToSchedule.forEach(t => {
    if (!t.scheduledDate) {
      unassignedTasks.push(t);
    }
  });

  if (isAfter(currentDate, deadlineDate)) {
    conflict = `The schedule exceeds the deadline of ${format(deadlineDate, 'yyyy-MM-dd')}. Try increasing daily available hours or reducing scope.`;
  }

  return {
    tasksByDate,
    overdueTasks,
    unassignedTasks,
    conflict
  };
}
