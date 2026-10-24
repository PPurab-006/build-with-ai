export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'dropped';

export interface Task {
  id: string;
  title: string;
  description: string;
  milestoneId: string;
  estimatedHours: number; // positive finite number, e.g., 0.5, 1.0, 1.5, 2.0
  priority: TaskPriority;
  dependencies: string[]; // array of prerequisite task IDs
  completionCriterion: string; // verifiable acceptance test
  status: TaskStatus;
  completedOnDay?: number; // 1-indexed relative day when completed
  scheduledDay?: number; // 1-indexed relative day, or undefined if unscheduled
}

export interface Milestone {
  id: string;
  title: string;
  targetDay: number;
}

export interface Goal {
  title: string;
  dailyHours: number;
  totalDays: number;
  context?: string;
  constraints?: string;
  isRelativeDays: boolean; // true for 7-day sample project demo
  createdAt?: string;
}

export interface DaySchedule {
  dayNumber: number; // 1, 2, ...
  dateLabel: string; // "Day 1" or formatted calendar date
  capacityHours: number;
  allocatedHours: number;
  taskIds: string[];
}

export type DiagnosticIssueType =
  | 'CYCLE_DETECTED'
  | 'INVALID_INPUT'
  | 'OVERSIZED_TASK'
  | 'CAPACITY_EXCEEDED'
  | 'DEPENDENCY_BOTTLENECK';

export interface DiagnosticIssue {
  taskId?: string;
  type: DiagnosticIssueType;
  message: string;
}

export interface FeasibilityReport {
  isFeasible: boolean; // TRUE only if 100% of required incomplete tasks are validly scheduled before deadline
  remainingEffortHours: number;
  availableCapacityHours: number;
  shortfallHours: number;
  diagnostics: DiagnosticIssue[];
  unscheduledTaskIds: string[];
}

export interface TaskDiff {
  taskId: string;
  taskTitle: string;
  originalDay?: number;
  proposedDay?: number;
  changeType: 'unchanged' | 'moved' | 'unscheduled' | 'dropped';
  reason?: string;
}

export interface RecoveryOptionPreview {
  type: 'increase_hours' | 'extend_deadline' | 'reduce_scope';
  label: string;
  proposedParameter: number | string[]; // new dailyHours, new totalDays, or droppedTaskIds
  isFeasible: boolean;
  shortfallHours: number;
  affectedDependencies?: string[]; // IDs of tasks affected by scope reduction
  affectedMilestones?: string[];
  impactSummary: string;
}

export interface RevisionRecord {
  id?: string;
  revisionNumber: number;
  timestamp: string;
  reason: string;
  summary: string;
  scheduleSnapshot?: DaySchedule[];
  tasksShiftedCount?: number;
  tasksDroppedCount?: number;
}

export type RevisionHistoryEntry = RevisionRecord;

export interface PlannerState {
  goal: Goal | null;
  milestones: Milestone[];
  tasks: Task[];
  schedule: DaySchedule[];
  currentDay: number; // 1-indexed active day
  overallProgressPercent?: number;
  completedEffortHours?: number;
  remainingEffortHours?: number;
  revisionHistory: RevisionRecord[];
  lastReplanTimestamp?: string;
}

export interface ScheduleResult {
  schedule: DaySchedule[];
  tasks: Task[];
  unscheduledTasks: { taskId: string; reason: string }[];
  feasibility: FeasibilityReport;
}

export interface ReplanPreview {
  diffs: TaskDiff[];
  report: FeasibilityReport;
  proposedSchedule: DaySchedule[];
  proposedTasks: Task[];
  recoveryOptions: RecoveryOptionPreview[];
}
