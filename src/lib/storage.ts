import { PlannerState } from '../types/planner';

export const STORAGE_KEY = 'adaptive_execution_planner_state_v1';

/**
 * Validates whether an unknown object conforms to the PlannerState schema.
 */
export function isValidPlannerState(obj: unknown): obj is PlannerState {
  if (!obj || typeof obj !== 'object') return false;
  const state = obj as Record<string, unknown>;

  // If goal is null, it's a valid empty state
  if (state.goal === null) {
    return Array.isArray(state.milestones) && Array.isArray(state.tasks) && Array.isArray(state.schedule);
  }

  // If goal is present, validate required properties
  const goal = state.goal as Record<string, unknown>;
  if (
    !goal ||
    typeof goal.title !== 'string' ||
    typeof goal.dailyHours !== 'number' ||
    typeof goal.totalDays !== 'number' ||
    typeof goal.isRelativeDays !== 'boolean'
  ) {
    return false;
  }

  // Validate tasks and schedule arrays
  if (!Array.isArray(state.tasks) || !Array.isArray(state.schedule) || !Array.isArray(state.milestones)) {
    return false;
  }

  // Validate revision history array if present
  if (state.revisionHistory && !Array.isArray(state.revisionHistory)) {
    return false;
  }

  return true;
}

/**
 * Safely loads the saved planner state from localStorage with SSR guards and schema validation.
 */
export function loadPlannerState(): PlannerState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (isValidPlannerState(parsed)) {
      return parsed;
    } else {
      console.warn('[Storage] Stored planner state failed schema validation. Resetting to initial.');
      return null;
    }
  } catch (err) {
    console.error('[Storage] Error reading state from localStorage:', err);
    return null;
  }
}

/**
 * Safely serializes and persists the planner state to localStorage.
 */
export function savePlannerState(state: PlannerState): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('[Storage] Error saving state to localStorage:', err);
    return false;
  }
}

/**
 * Clears the planner state from localStorage.
 */
export function clearPlannerState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[Storage] Error clearing localStorage:', err);
  }
}
