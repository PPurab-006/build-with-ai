import {
  Task,
  Goal,
  DaySchedule,
  FeasibilityReport,
  DiagnosticIssue,
  TaskDiff,
  RecoveryOptionPreview,
  ScheduleResult,
  ReplanPreview,
  PlannerState,
} from '../types/planner';

/**
 * Validates task inputs for unique IDs, finite positive effort,
 * valid dependency references, and absence of cycles.
 */
export function validateTaskInputs(tasks: Task[]): {
  valid: boolean;
  errors: DiagnosticIssue[];
  cycle?: string[];
} {
  const errors: DiagnosticIssue[] = [];
  const idSet = new Set<string>();

  // 1. Check unique IDs and positive effort
  for (const task of tasks) {
    if (!task.id || typeof task.id !== 'string') {
      errors.push({
        type: 'INVALID_INPUT',
        message: 'Task is missing a valid string ID.',
      });
      continue;
    }

    if (idSet.has(task.id)) {
      errors.push({
        taskId: task.id,
        type: 'INVALID_INPUT',
        message: `Duplicate task ID detected: "${task.id}".`,
      });
    }
    idSet.add(task.id);

    if (typeof task.estimatedHours !== 'number' || !Number.isFinite(task.estimatedHours) || task.estimatedHours <= 0) {
      errors.push({
        taskId: task.id,
        type: 'INVALID_INPUT',
        message: `Task "${task.title || task.id}" must have a finite positive effort estimate in hours. Received: ${task.estimatedHours}.`,
      });
    }
  }

  // 2. Check valid dependency references
  for (const task of tasks) {
    if (Array.isArray(task.dependencies)) {
      for (const depId of task.dependencies) {
        if (!idSet.has(depId)) {
          errors.push({
            taskId: task.id,
            type: 'INVALID_INPUT',
            message: `Task "${task.title || task.id}" references non-existent dependency "${depId}".`,
          });
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 3. Cycle detection using Kahn's algorithm
  const inDegree: Map<string, number> = new Map();
  const adjList: Map<string, string[]> = new Map();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adjList.set(task.id, []);
  }

  for (const task of tasks) {
    for (const depId of task.dependencies) {
      // depId -> task.id (depId must finish before task.id)
      adjList.get(depId)!.push(task.id);
      inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  let visitedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visitedCount++;
    for (const neighbor of adjList.get(curr)!) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (visitedCount < tasks.length) {
    // Collect tasks involved in the cycle
    const cycleTasks = Array.from(inDegree.entries())
      .filter(([_, deg]) => deg > 0)
      .map(([id]) => id);

    errors.push({
      type: 'CYCLE_DETECTED',
      message: `Circular dependency detected involving tasks: ${cycleTasks.join(', ')}.`,
    });
    return { valid: false, errors, cycle: cycleTasks };
  }

  return { valid: true, errors: [] };
}

/**
 * Calculates how many downstream tasks depend on a given task (directly or indirectly).
 * Used as a stable tie-breaker so tasks that unblock more work are scheduled earlier.
 */
export function calculateDownstreamDepth(taskId: string, tasks: Task[]): number {
  const downstreamMap = new Map<string, string[]>();
  for (const t of tasks) {
    for (const dep of t.dependencies) {
      if (!downstreamMap.has(dep)) downstreamMap.set(dep, []);
      downstreamMap.get(dep)!.push(t.id);
    }
  }

  const visited = new Set<string>();
  const stack = [taskId];
  while (stack.length > 0) {
    const curr = stack.pop()!;
    const dependents = downstreamMap.get(curr) || [];
    for (const d of dependents) {
      if (!visited.has(d)) {
        visited.add(d);
        stack.push(d);
      }
    }
  }
  return visited.size;
}

/**
 * Deterministically sorts tasks using stable priority, dependency depth, and index tie-breakers.
 */
function sortTasksForScheduling(tasks: Task[]): Task[] {
  const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const depthCache = new Map<string, number>();

  for (const t of tasks) {
    depthCache.set(t.id, calculateDownstreamDepth(t.id, tasks));
  }

  return [...tasks].sort((a, b) => {
    // 1. Priority (high > medium > low)
    const pDiff = (priorityScore[b.priority] || 1) - (priorityScore[a.priority] || 1);
    if (pDiff !== 0) return pDiff;

    // 2. Dependency Depth (unblocks more work first)
    const dDiff = (depthCache.get(b.id) || 0) - (depthCache.get(a.id) || 0);
    if (dDiff !== 0) return dDiff;

    // 3. Stable fallback: task ID
    return a.id.localeCompare(b.id);
  });
}

/**
 * Allocates tasks to calendar/project days deterministically without mutating inputs.
 */
export function allocateTasksToDays(
  tasks: Task[],
  dailyCapacity: number,
  totalDays: number,
  startDay: number = 1,
  completedDayMap: Map<string, number> = new Map()
): {
  schedule: DaySchedule[];
  scheduledTasks: Task[];
  unscheduled: { taskId: string; reason: string }[];
} {
  // Deep clone tasks to preserve purity
  const clonedTasks: Task[] = tasks.map((t) => ({ ...t }));
  const unscheduled: { taskId: string; reason: string }[] = [];

  // Initialize day schedules
  const schedule: DaySchedule[] = [];
  for (let d = 1; d <= totalDays; d++) {
    schedule.push({
      dayNumber: d,
      dateLabel: `Day ${d}`,
      capacityHours: dailyCapacity,
      allocatedHours: 0,
      taskIds: [],
    });
  }

  // Pre-place completed tasks
  const taskScheduledDay = new Map<string, number>();
  for (const [taskId, dayNum] of completedDayMap.entries()) {
    taskScheduledDay.set(taskId, dayNum);
    const day = schedule[dayNum - 1];
    if (day) {
      day.taskIds.push(taskId);
      const t = clonedTasks.find((item) => item.id === taskId);
      if (t) {
        day.allocatedHours = Math.round((day.allocatedHours + t.estimatedHours) * 100) / 100;
        t.scheduledDay = dayNum;
      }
    }
  }

  // Identify tasks needing scheduling (incomplete tasks)
  const remainingTasks = clonedTasks.filter((t) => t.status !== 'completed' && t.status !== 'dropped');

  // Check for oversized tasks
  for (const t of remainingTasks) {
    if (t.estimatedHours > dailyCapacity) {
      unscheduled.push({
        taskId: t.id,
        reason: `Task effort (${t.estimatedHours}h) exceeds configured daily capacity limit (${dailyCapacity}h).`,
      });
    }
  }

  // Filter down to schedulable remaining tasks
  let candidateTasks = sortTasksForScheduling(
    remainingTasks.filter((t) => t.estimatedHours <= dailyCapacity)
  );

  // Progressive day allocation loop
  // For each day from startDay to totalDays, place ready tasks that fit within capacity
  for (let d = startDay; d <= totalDays; d++) {
    const day = schedule[d - 1];
    let dayHoursRemaining = Math.max(0, dailyCapacity - day.allocatedHours);

    // Find tasks whose prerequisites are completely scheduled/finished BEFORE day d
    const readyTasks: Task[] = [];
    const notReadyTasks: Task[] = [];

    for (const t of candidateTasks) {
      const allDepsScheduledBefore = t.dependencies.every((depId) => {
        const depDay = taskScheduledDay.get(depId);
        return depDay !== undefined && depDay < d;
      });

      if (allDepsScheduledBefore) {
        readyTasks.push(t);
      } else {
        notReadyTasks.push(t);
      }
    }

    const unplacedOnThisDay: Task[] = [];

    for (const t of readyTasks) {
      if (t.estimatedHours <= dayHoursRemaining) {
        // Fits on day d!
        day.taskIds.push(t.id);
        day.allocatedHours = Math.round((day.allocatedHours + t.estimatedHours) * 100) / 100;
        dayHoursRemaining = Math.max(0, dailyCapacity - day.allocatedHours);
        taskScheduledDay.set(t.id, d);
        t.scheduledDay = d;
      } else {
        // Does not fit on this day due to capacity
        unplacedOnThisDay.push(t);
      }
    }

    // Recombine for the next day
    candidateTasks = sortTasksForScheduling([...unplacedOnThisDay, ...notReadyTasks]);
  }

  // Any candidate task still unplaced is unscheduled
  for (const t of candidateTasks) {
    // Check if it was blocked by dependencies or capacity
    const maxDepDay = t.dependencies.reduce((max, depId) => {
      const depDay = taskScheduledDay.get(depId) || 0;
      return Math.max(max, depDay);
    }, 0);

    let reason: string;
    if (maxDepDay >= totalDays) {
      reason = `Prerequisite tasks are scheduled on or after Day ${maxDepDay}, delaying this task past the deadline (Day ${totalDays}).`;
    } else {
      reason = `Cannot fit into remaining capacity before deadline (Day ${totalDays}).`;
    }

    unscheduled.push({ taskId: t.id, reason });
    t.scheduledDay = undefined;
  }

  return {
    schedule,
    scheduledTasks: clonedTasks,
    unscheduled,
  };
}

/**
 * Evaluates comprehensive multi-factor feasibility.
 * Feasibility is TRUE only when 100% of required incomplete tasks are validly scheduled before deadline.
 */
export function evaluateFeasibility(
  tasks: Task[],
  dailyCapacity: number,
  totalDays: number,
  currentDay: number = 1,
  completedDayMap: Map<string, number> = new Map()
): FeasibilityReport {
  const diagnostics: DiagnosticIssue[] = [];

  // 1. Input validation
  const validation = validateTaskInputs(tasks);
  if (!validation.valid) {
    return {
      isFeasible: false,
      remainingEffortHours: 0,
      availableCapacityHours: 0,
      shortfallHours: 0,
      diagnostics: validation.errors,
      unscheduledTaskIds: tasks.map((t) => t.id),
    };
  }

  // 2. Incomplete tasks effort calculation
  const incompleteTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'dropped');
  const remainingEffortHours = Math.round(
    incompleteTasks.reduce((sum, t) => sum + t.estimatedHours, 0) * 100
  ) / 100;

  const remainingDays = Math.max(0, totalDays - currentDay + 1);
  const availableCapacityHours = Math.round(remainingDays * dailyCapacity * 100) / 100;
  const shortfallHours = Math.max(0, Math.round((remainingEffortHours - availableCapacityHours) * 100) / 100);

  if (shortfallHours > 0) {
    diagnostics.push({
      type: 'CAPACITY_EXCEEDED',
      message: `Remaining effort (${remainingEffortHours}h) exceeds available capacity (${availableCapacityHours}h) by ${shortfallHours}h.`,
    });
  }

  // 3. Run allocation to detect exact task-level placement and dependency bottlenecks
  const allocation = allocateTasksToDays(tasks, dailyCapacity, totalDays, currentDay, completedDayMap);

  for (const item of allocation.unscheduled) {
    const t = tasks.find((x) => x.id === item.taskId);
    const issueType =
      t && t.estimatedHours > dailyCapacity
        ? 'OVERSIZED_TASK'
        : item.reason.includes('Prerequisite')
        ? 'DEPENDENCY_BOTTLENECK'
        : 'CAPACITY_EXCEEDED';

    diagnostics.push({
      taskId: item.taskId,
      type: issueType,
      message: item.reason,
    });
  }

  const unscheduledTaskIds = allocation.unscheduled.map((u) => u.taskId);
  const isFeasible = diagnostics.length === 0 && unscheduledTaskIds.length === 0;

  return {
    isFeasible,
    remainingEffortHours,
    availableCapacityHours,
    shortfallHours,
    diagnostics,
    unscheduledTaskIds,
  };
}

/**
 * Finds all downstream tasks that depend directly or indirectly on a given task ID.
 */
export function getDownstreamDependencies(taskId: string, tasks: Task[]): string[] {
  const downstreamMap = new Map<string, string[]>();
  for (const t of tasks) {
    for (const dep of t.dependencies) {
      if (!downstreamMap.has(dep)) downstreamMap.set(dep, []);
      downstreamMap.get(dep)!.push(t.id);
    }
  }

  const visited = new Set<string>();
  const stack = [taskId];
  while (stack.length > 0) {
    const curr = stack.pop()!;
    const dependents = downstreamMap.get(curr) || [];
    for (const d of dependents) {
      if (!visited.has(d)) {
        visited.add(d);
        stack.push(d);
      }
    }
  }
  return Array.from(visited);
}

/**
 * Evaluates the 3 concrete recovery options when a schedule is infeasible.
 * Every option re-runs the exact allocation and feasibility engine on cloned inputs.
 */
export function evaluateRecoveryOptions(
  tasks: Task[],
  dailyCapacity: number,
  totalDays: number,
  currentDay: number,
  completedDayMap: Map<string, number>
): RecoveryOptionPreview[] {
  const options: RecoveryOptionPreview[] = [];
  const incompleteTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'dropped');

  if (incompleteTasks.length === 0) return options;

  const remainingEffort = incompleteTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const remainingDays = Math.max(1, totalDays - currentDay + 1);

  // 1. Option 1: Increase Daily Availability
  // Calculate minimum daily hours required to fit all remaining effort
  let proposedDailyHours = Math.ceil((remainingEffort / remainingDays) * 10) / 10;
  if (proposedDailyHours <= dailyCapacity) {
    proposedDailyHours = dailyCapacity + 1.0;
  }

  // Verify feasibility with proposed capacity
  let opt1Feasibility = evaluateFeasibility(tasks, proposedDailyHours, totalDays, currentDay, completedDayMap);
  // If still blocked by bottleneck, incrementally add capacity until feasible or limit reached
  let attempts = 0;
  while (!opt1Feasibility.isFeasible && attempts < 5) {
    proposedDailyHours = Math.round((proposedDailyHours + 0.5) * 10) / 10;
    opt1Feasibility = evaluateFeasibility(tasks, proposedDailyHours, totalDays, currentDay, completedDayMap);
    attempts++;
  }

  options.push({
    type: 'increase_hours',
    label: `Increase Daily Availability to ${proposedDailyHours}h / day`,
    proposedParameter: proposedDailyHours,
    isFeasible: opt1Feasibility.isFeasible,
    shortfallHours: opt1Feasibility.shortfallHours,
    impactSummary: `Increases daily commitment from ${dailyCapacity}h to ${proposedDailyHours}h per day for the remaining ${remainingDays} days.`,
  });

  // 2. Option 2: Extend Deadline
  // Calculate minimum extra days
  const baseShortfall = Math.max(0, remainingEffort - remainingDays * dailyCapacity);
  let extraDays = Math.max(1, Math.ceil(baseShortfall / dailyCapacity));
  let proposedTotalDays = totalDays + extraDays;

  let opt2Feasibility = evaluateFeasibility(tasks, dailyCapacity, proposedTotalDays, currentDay, completedDayMap);
  let extAttempts = 0;
  while (!opt2Feasibility.isFeasible && extAttempts < 5) {
    proposedTotalDays += 1;
    opt2Feasibility = evaluateFeasibility(tasks, dailyCapacity, proposedTotalDays, currentDay, completedDayMap);
    extAttempts++;
  }

  options.push({
    type: 'extend_deadline',
    label: `Extend Deadline by ${proposedTotalDays - totalDays} day${proposedTotalDays - totalDays > 1 ? 's' : ''} (Day ${proposedTotalDays})`,
    proposedParameter: proposedTotalDays,
    isFeasible: opt2Feasibility.isFeasible,
    shortfallHours: opt2Feasibility.shortfallHours,
    impactSummary: `Adds ${proposedTotalDays - totalDays} day(s) to the schedule while maintaining the ${dailyCapacity}h daily capacity.`,
  });

  // 3. Option 3: Reduce Scope
  // Find lowest priority incomplete tasks to propose dropping
  const priorityOrder: Record<string, number> = { low: 1, medium: 2, high: 3 };
  const sortedByLowestPriority = [...incompleteTasks].sort(
    (a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
  );

  const candidateToDrop = sortedByLowestPriority[0];
  if (candidateToDrop) {
    const affectedDeps = getDownstreamDependencies(candidateToDrop.id, tasks);
    const allDroppedIds = [candidateToDrop.id, ...affectedDeps];

    // Filter tasks without the dropped ones
    const reducedTasks = tasks.map((t) =>
      allDroppedIds.includes(t.id) ? { ...t, status: 'dropped' as const } : { ...t }
    );

    const opt3Feasibility = evaluateFeasibility(reducedTasks, dailyCapacity, totalDays, currentDay, completedDayMap);

    const affectedTaskTitles = tasks
      .filter((t) => allDroppedIds.includes(t.id))
      .map((t) => t.title);

    options.push({
      type: 'reduce_scope',
      label: `Reduce Scope: Drop "${candidateToDrop.title}"`,
      proposedParameter: allDroppedIds,
      isFeasible: opt3Feasibility.isFeasible,
      shortfallHours: opt3Feasibility.shortfallHours,
      affectedDependencies: affectedDeps,
      affectedMilestones: [candidateToDrop.milestoneId],
      impactSummary: `Drops "${candidateToDrop.title}" (${candidateToDrop.estimatedHours}h). ${
        affectedDeps.length > 0
          ? `Also cascades to drop ${affectedDeps.length} dependent task(s): ${affectedTaskTitles.slice(1).join(', ')}.`
          : 'No downstream dependencies affected.'
      }`,
    });
  }

  return options;
}

/**
 * Generates the initial plan schedule for a new goal and task list.
 */
export function generateInitialSchedule(goal: Goal, tasks: Task[]): ScheduleResult {
  const validation = validateTaskInputs(tasks);
  if (!validation.valid) {
    return {
      schedule: [],
      tasks,
      unscheduledTasks: tasks.map((t) => ({ taskId: t.id, reason: 'Validation failed' })),
      feasibility: {
        isFeasible: false,
        remainingEffortHours: 0,
        availableCapacityHours: 0,
        shortfallHours: 0,
        diagnostics: validation.errors,
        unscheduledTaskIds: tasks.map((t) => t.id),
      },
    };
  }

  const allocation = allocateTasksToDays(tasks, goal.dailyHours, goal.totalDays, 1);
  const feasibility = evaluateFeasibility(allocation.scheduledTasks, goal.dailyHours, goal.totalDays, 1);

  return {
    schedule: allocation.schedule,
    tasks: allocation.scheduledTasks,
    unscheduledTasks: allocation.unscheduled,
    feasibility,
  };
}

/**
 * Computes a non-destructive replan preview comparing current state against proposed adjustments.
 * Never mutates input state.
 */
export function computeReplanPreview(state: PlannerState, missedTaskIds: string[] = []): ReplanPreview {
  const goal = state.goal!;
  const completedDayMap = new Map<string, number>();

  for (const t of state.tasks) {
    if (t.status === 'completed' && t.completedOnDay !== undefined) {
      completedDayMap.set(t.id, t.completedOnDay);
    }
  }

  // Clone tasks and preserve completed status
  const currentTasks = state.tasks.map((t) => ({ ...t }));

  // Run allocation from currentDay forward
  const allocation = allocateTasksToDays(
    currentTasks,
    goal.dailyHours,
    goal.totalDays,
    state.currentDay,
    completedDayMap
  );

  // Evaluate feasibility
  const report = evaluateFeasibility(
    allocation.scheduledTasks,
    goal.dailyHours,
    goal.totalDays,
    state.currentDay,
    completedDayMap
  );

  // Compute Task Diffs
  const diffs: TaskDiff[] = [];
  for (const proposedTask of allocation.scheduledTasks) {
    const origTask = state.tasks.find((t) => t.id === proposedTask.id);
    const origDay = origTask?.scheduledDay;
    const propDay = proposedTask.scheduledDay;

    if (proposedTask.status === 'completed') {
      diffs.push({
        taskId: proposedTask.id,
        taskTitle: proposedTask.title,
        originalDay: origDay,
        proposedDay: propDay,
        changeType: 'unchanged',
        reason: 'Completed task preserved on its historical completion day.',
      });
    } else if (propDay === undefined) {
      diffs.push({
        taskId: proposedTask.id,
        taskTitle: proposedTask.title,
        originalDay: origDay,
        proposedDay: undefined,
        changeType: 'unscheduled',
        reason: report.diagnostics.find((d) => d.taskId === proposedTask.id)?.message || 'Cannot fit before deadline.',
      });
    } else if (origDay !== propDay) {
      diffs.push({
        taskId: proposedTask.id,
        taskTitle: proposedTask.title,
        originalDay: origDay,
        proposedDay: propDay,
        changeType: 'moved',
        reason: `Shifted from Day ${origDay} to Day ${propDay} to respect capacity and dependencies.`,
      });
    } else {
      diffs.push({
        taskId: proposedTask.id,
        taskTitle: proposedTask.title,
        originalDay: origDay,
        proposedDay: propDay,
        changeType: 'unchanged',
      });
    }
  }

  // Compute recovery options if infeasible
  const recoveryOptions = !report.isFeasible
    ? evaluateRecoveryOptions(state.tasks, goal.dailyHours, goal.totalDays, state.currentDay, completedDayMap)
    : [];

  return {
    diffs,
    report,
    proposedSchedule: allocation.schedule,
    proposedTasks: allocation.scheduledTasks,
    recoveryOptions,
  };
}
