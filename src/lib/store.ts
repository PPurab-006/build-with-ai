import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Goal, Schedule } from './types';
import { generateSchedule } from './engine';

interface AppState {
  goal: Goal | null;
  tasks: Task[];
  schedule: Schedule | null;
  setGoal: (goal: Goal) => void;
  setTasks: (tasks: Task[]) => void;
  updateTaskStatus: (taskId: string, status: 'pending' | 'completed' | 'blocked') => void;
  replan: () => void;
  clearState: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      goal: null,
      tasks: [],
      schedule: null,
      setGoal: (goal) => {
        set({ goal });
      },
      setTasks: (tasks) => {
        set({ tasks });
        get().replan();
      },
      updateTaskStatus: (taskId, status) => {
        const { tasks, schedule } = get();
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);

        let newSchedule = schedule;
        if (schedule) {
          const newTasksByDate = { ...schedule.tasksByDate };
          Object.keys(newTasksByDate).forEach(date => {
            newTasksByDate[date] = newTasksByDate[date].map(t =>
              t.id === taskId ? { ...t, status } : t
            );
          });
          const newOverdueTasks = schedule.overdueTasks.map(t =>
            t.id === taskId ? { ...t, status } : t
          );

          newSchedule = {
            ...schedule,
            tasksByDate: newTasksByDate,
            overdueTasks: newOverdueTasks
          };
        }

        set({ tasks: updatedTasks, schedule: newSchedule });
      },
      replan: () => {
        const { goal, tasks } = get();
        if (!goal || tasks.length === 0) return;
        try {
          const schedule = generateSchedule(tasks, goal);

          const newTasks = [...tasks];
          Object.entries(schedule.tasksByDate).forEach(([date, scheduledTasks]) => {
            scheduledTasks.forEach(st => {
              const idx = newTasks.findIndex(t => t.id === st.id);
              if (idx !== -1) {
                newTasks[idx] = { ...newTasks[idx], scheduledDate: date };
              }
            });
          });

          set({ tasks: newTasks, schedule });
        } catch (e) {
          console.error("Failed to generate schedule", e);
        }
      },
      clearState: () => {
        set({ goal: null, tasks: [], schedule: null });
      }
    }),
    {
      name: 'build-with-ai-planner-storage',
    }
  )
);
