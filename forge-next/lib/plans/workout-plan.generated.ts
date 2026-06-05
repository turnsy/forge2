/* AUTO-GENERATED — do not edit */

export type NonEmptyString = string;
export type PlannedSet = ExactPlannedSet | TargetPlannedSet;
/**
 * Supports simple reps (5) and combined reps (3+1).
 */
export type RepsValue = number | string;
export type Load = AbsoluteLoad | PercentageLoad;
export type PercentageLoad = (
  | {
      operator?: "exact";
      [k: string]: unknown;
    }
  | {
      operator?: "at-least";
      [k: string]: unknown;
    }
  | {
      operator?: "at-most";
      [k: string]: unknown;
    }
  | {
      operator?: "range";
      [k: string]: unknown;
    }
) & {
  type: "percentage";
  unit: "%";
  basis?: NonEmptyString;
  operator: "exact" | "range" | "at-least" | "at-most";
  value?: number;
  minValue?: number;
  maxValue?: number;
};

/**
 * Athlete-facing workout plan schema with week/day structure and one entry per planned set.
 */
export interface WorkoutPlan {
  schemaVersion: "2.0.0";
  id?: NonEmptyString;
  name: NonEmptyString;
  discipline?: NonEmptyString;
  description?: string;
  notes?: string;
  /**
   * @minItems 1
   */
  weeks: [Week, ...Week[]];
}
export interface Week {
  index: number;
  label?: string;
  name?: string;
  notes?: string;
  /**
   * @minItems 1
   */
  days: [Day, ...Day[]];
}
export interface Day {
  index: number;
  code: string;
  name?: string;
  notes?: string;
  /**
   * @minItems 1
   */
  exercises: [Exercise, ...Exercise[]];
}
export interface Exercise {
  id?: NonEmptyString;
  name: NonEmptyString;
  notes?: string;
  /**
   * @minItems 1
   */
  sets: [Set, ...Set[]];
}
export interface Set {
  id: NonEmptyString;
  planned: PlannedSet;
  actual: ActualSet | null;
  status: "planned" | "completed" | "skipped";
  locked: boolean;
  notes?: string;
}
export interface ExactPlannedSet {
  type: "exact";
  reps: RepsValue;
  load: Load;
  tempo?: string;
  restSeconds?: number;
  notes?: string;
}
export interface AbsoluteLoad {
  type: "absolute";
  value: number;
  unit: "kg" | "lb" | "g";
}
export interface TargetPlannedSet {
  type: "target";
  instruction: NonEmptyString;
  reps?: RepsValue;
  load?: Load;
  notes?: string;
}
export interface ActualSet {
  reps: RepsValue;
  load?: Load;
  completedAt?: string;
  notes?: string;
}
