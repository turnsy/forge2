"use server";

import {
  applySetActuals,
  findNextDayAfter,
} from "@/lib/athlete/plan/domain";
import {
  completeDay,
  getAssignedPlanById,
  savePlanActuals,
} from "@/lib/athlete/plan/repository";
import { requireRoleAuth } from "@/lib/errors/require-role-auth";
import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import type { ActualSet, WorkoutPlan } from "@/lib/plans/workout-plan";
import { getFlattenedExercise } from "@/lib/plans/day-blocks";
import { estimateOneRepMax } from "@/lib/maxes/estimate-one-rep-max";
import { insertAthleteMax, listAthleteMaxes } from "@/lib/maxes/mutations";
import { resolveCurrentMax } from "@/lib/maxes/resolve-current-max";
import { convertWeight } from "@/lib/maxes/units";

export type SaveSetActualsActionResult = ServiceResult<Record<never, never>>;

export type CompleteDayActionResult = ServiceResult<{
  nextDayPos: number | null;
  allDaysDone: boolean;
  plan: WorkoutPlan;
}>;

export async function saveSetActualsAction(
  assignmentId: string,
  weekPos: number,
  dayPos: number,
  exercisePos: number,
  setPos: number,
  actual: ActualSet | null,
): Promise<SaveSetActualsActionResult> {
  const auth = await requireRoleAuth("athlete");
  if (!auth.ok) {
    return auth;
  }

  const assignmentResult = await getAssignedPlanById(assignmentId);
  if (!assignmentResult.ok) {
    return assignmentResult;
  }

  const assignment = assignmentResult.plan;
  if (!assignment || assignment.athleteId !== auth.user.id) {
    return serviceError(
      ServiceErrorCode.NOT_FOUND,
      "Assignment not found or access denied",
    );
  }

  const updatedPlan = applySetActuals(
    assignment.plan,
    weekPos,
    dayPos,
    exercisePos,
    setPos,
    actual,
  );

  const saved = await savePlanActuals(assignmentId, updatedPlan);
  if (saved.ok && actual?.reps !== undefined && actual.target?.type === "absolute") {
    const day = updatedPlan.weeks[weekPos]?.days[dayPos];
    const exercise = day ? getFlattenedExercise(day, exercisePos)?.exercise : null;
    const exerciseId = exercise?.resolvedExerciseId;
    const estimate = exerciseId
      ? estimateOneRepMax(actual.target.value, actual.reps)
      : null;
    if (exerciseId && estimate !== null) {
      try {
        const rows = await listAthleteMaxes(auth.user.id, [exerciseId]);
        const current = resolveCurrentMax(
          rows.map((row) => ({
            value: Number(row.value),
            unit: row.unit,
            loggedAt: row.logged_at,
            source: row.source,
          })),
        );
        const currentInLogUnit = current
          ? convertWeight(current.value, current.unit, actual.target.unit)
          : null;
        if (currentInLogUnit === null || estimate <= currentInLogUnit * 1.2) {
          await insertAthleteMax({
            athleteId: auth.user.id,
            exerciseId,
            value: estimate,
            unit: actual.target.unit,
            source: "estimated_from_log",
          });
        }
      } catch {
        // Workout saving remains successful if max estimation is unavailable.
      }
    }
  }
  return saved;
}

export async function completeDayAction(
  assignmentId: string,
  weekPos: number,
  dayPos: number,
): Promise<CompleteDayActionResult> {
  const auth = await requireRoleAuth("athlete");
  if (!auth.ok) {
    return auth;
  }

  const assignmentResult = await getAssignedPlanById(assignmentId);
  if (!assignmentResult.ok) {
    return assignmentResult;
  }

  const assignment = assignmentResult.plan;
  if (!assignment || assignment.athleteId !== auth.user.id) {
    return serviceError(
      ServiceErrorCode.NOT_FOUND,
      "Assignment not found or access denied",
    );
  }

  const completeResult = await completeDay(
    assignmentId,
    assignment.plan,
    weekPos,
    dayPos,
  );

  if (!completeResult.ok) {
    return completeResult;
  }

  const { allDaysDone, plan } = completeResult;

  if (allDaysDone) {
    return { ok: true, nextDayPos: null, allDaysDone: true, plan };
  }

  const nextDay = findNextDayAfter(plan, weekPos, dayPos);

  return {
    ok: true,
    nextDayPos: nextDay?.dayPos ?? null,
    allDaysDone: false,
    plan,
  };
}
