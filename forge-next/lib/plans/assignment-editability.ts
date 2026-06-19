import type { Set, WorkoutPlan } from "@/lib/plans/workout-plan";

export function isLockedSet(set: Set): boolean {
  return set.status === "completed" || set.status === "skipped";
}

export function countAssignmentEditability(plan: WorkoutPlan): {
  editableDayCount: number;
  lockedDayCount: number;
} {
  let editableDayCount = 0;
  let lockedDayCount = 0;

  for (const week of plan.weeks) {
    for (const day of week.days) {
      const hasLocked = day.exercises.some((exercise) =>
        exercise.sets.some((set) => isLockedSet(set)),
      );

      if (hasLocked) {
        lockedDayCount += 1;
      } else {
        editableDayCount += 1;
      }
    }
  }

  return { editableDayCount, lockedDayCount };
}

function collectSetsById(
  plan: WorkoutPlan,
): Map<string, Pick<Set, "planned" | "actual" | "status">> {
  const sets = new Map<string, Pick<Set, "planned" | "actual" | "status">>();

  for (const week of plan.weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        for (const set of exercise.sets) {
          sets.set(set.id, {
            planned: set.planned,
            actual: set.actual,
            status: set.status,
          });
        }
      }
    }
  }

  return sets;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

export type LockedSetMutation = {
  code: "LOCKED_SET_MUTATED" | "LOCKED_SET_REMOVED";
  message: string;
};

export function detectLockedSetMutations(
  seed: WorkoutPlan,
  output: WorkoutPlan,
): LockedSetMutation[] {
  const seedSets = collectSetsById(seed);
  const outputSets = collectSetsById(output);
  const errors: LockedSetMutation[] = [];

  for (const [setId, seedSet] of seedSets) {
    if (!isLockedSet(seedSet as Set)) {
      continue;
    }

    const outputSet = outputSets.get(setId);
    if (!outputSet) {
      errors.push({
        code: "LOCKED_SET_REMOVED",
        message: `Locked set ${setId} was removed from the plan.`,
      });
      continue;
    }

    if (stableJson(seedSet.planned) !== stableJson(outputSet.planned)) {
      errors.push({
        code: "LOCKED_SET_MUTATED",
        message: `Locked set ${setId} planned fields were modified.`,
      });
    }

    if (stableJson(seedSet.actual) !== stableJson(outputSet.actual)) {
      errors.push({
        code: "LOCKED_SET_MUTATED",
        message: `Locked set ${setId} actual fields were modified.`,
      });
    }

    if (seedSet.status !== outputSet.status) {
      errors.push({
        code: "LOCKED_SET_MUTATED",
        message: `Locked set ${setId} status was modified.`,
      });
    }
  }

  return errors;
}
