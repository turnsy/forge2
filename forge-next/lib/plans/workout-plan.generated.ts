/* AUTO-GENERATED — do not edit */

export type NonEmptyString = string;
export type PlannedSet = ExactPlannedSet | TargetPlannedSet;
/**
 * Supports simple reps (5) and combined reps (3+1).
 */
export type RepsValue = number | string;
export type SetTarget = AbsoluteLoad | PercentageLoad;

/**
 * Athlete-facing workout plan schema: Plan → Week → Day → Block → Exercise → Set.
 */
export interface WorkoutPlan {
  schemaVersion: "3.0.0";
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
  label?: string;
  name?: string;
  notes?: string;
  /**
   * @minItems 1
   */
  days: [Day, ...Day[]];
}
export interface Day {
  code: string;
  name?: string;
  notes?: string;
  /**
   * @minItems 1
   */
  blocks: [Block, ...Block[]];
}
export interface Block {
  id: NonEmptyString;
  label?: string;
  notes?: string;
  /**
   * @minItems 1
   */
  exercises: [Exercise, ...Exercise[]];
}
export interface Exercise {
  id: NonEmptyString;
  name: NonEmptyString;
  notes?: string;
  videoUrl?: string;
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
  target: SetTarget;
  tempo?: string;
  restSeconds?: number;
  notes?: string;
}
export interface AbsoluteLoad {
  type: "absolute";
  value: number;
  unit: NonEmptyString;
}
export interface PercentageLoad {
  type: "percentage";
  value: number;
  unit: NonEmptyString;
}
export interface TargetPlannedSet {
  type: "target";
  instruction: NonEmptyString;
  reps?: RepsValue;
  target?: SetTarget;
  notes?: string;
}
export interface ActualSet {
  reps?: RepsValue;
  target?: SetTarget;
  completedAt?: string;
  notes?: string;
}
