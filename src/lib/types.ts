export interface Goal {
  id: string;
  description: string;
  deadline: string; // ISO format
  availableHoursPerDay: number;
  currentProgress: string;
  constraints: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedEffortHours: number;
  dependencies: string[]; // array of task ids that must be completed before this one
  status: 'pending' | 'completed' | 'blocked';
  scheduledDate?: string; // ISO format (day only, e.g. YYYY-MM-DD)
}

export interface Milestone {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Schedule {
  tasksByDate: Record<string, Task[]>;
  overdueTasks: Task[];
  unassignedTasks: Task[];
  conflict?: string; // If schedule exceeds deadline
}
