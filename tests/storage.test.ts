import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidPlannerState,
  loadPlannerState,
  savePlannerState,
  clearPlannerState,
  STORAGE_KEY,
} from '../src/lib/storage';
import { PlannerState } from '../src/types/planner';

describe('Storage Layer — Validation & Persistence', () => {
  beforeEach(() => {
    // Reset window and localStorage mock
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };

    vi.stubGlobal('window', {
      localStorage: mockStorage,
    });
  });

  it('validates a correct PlannerState schema', () => {
    const validState: PlannerState = {
      goal: {
        title: 'Learn AI in 7 Days',
        dailyHours: 2,
        totalDays: 7,
        isRelativeDays: true,
      },
      milestones: [],
      tasks: [],
      schedule: [],
      currentDay: 1,
      overallProgressPercent: 0,
      completedEffortHours: 0,
      remainingEffortHours: 0,
      revisionHistory: [],
    };

    expect(isValidPlannerState(validState)).toBe(true);
  });

  it('rejects an invalid or corrupted state object', () => {
    expect(isValidPlannerState(null)).toBe(false);
    expect(isValidPlannerState(undefined)).toBe(false);
    expect(isValidPlannerState('random string')).toBe(false);
    expect(isValidPlannerState({ goal: { title: 123 } })).toBe(false); // title is not a string
    expect(isValidPlannerState({ goal: null, tasks: 'not an array' })).toBe(false);
  });

  it('safely serializes and loads state from localStorage', () => {
    const testState: PlannerState = {
      goal: {
        title: 'Machine Learning PoC',
        dailyHours: 2.5,
        totalDays: 7,
        isRelativeDays: true,
      },
      milestones: [{ id: 'm1', title: 'Data Prep', targetDay: 3 }],
      tasks: [],
      schedule: [],
      currentDay: 2,
      overallProgressPercent: 20,
      completedEffortHours: 2,
      remainingEffortHours: 8,
      revisionHistory: [],
    };

    const saved = savePlannerState(testState);
    expect(saved).toBe(true);

    const loaded = loadPlannerState();
    expect(loaded).toBeDefined();
    expect(loaded?.goal?.title).toBe('Machine Learning PoC');
    expect(loaded?.goal?.dailyHours).toBe(2.5);
    expect(loaded?.currentDay).toBe(2);
  });

  it('clears state correctly from localStorage', () => {
    savePlannerState({
      goal: { title: 'Test', dailyHours: 1, totalDays: 3, isRelativeDays: false },
      milestones: [],
      tasks: [],
      schedule: [],
      currentDay: 1,
      overallProgressPercent: 0,
      completedEffortHours: 0,
      remainingEffortHours: 0,
      revisionHistory: [],
    });

    clearPlannerState();
    const loaded = loadPlannerState();
    expect(loaded).toBeNull();
  });
});
