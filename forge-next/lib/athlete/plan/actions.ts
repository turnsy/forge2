"use server";

import { findNextDayAfter } from "@/lib/athlete/plan/domain";
import {
  completeDay,
  getAssignedPlanById,
  saveWorkoutSetActuals,
} from "@/lib/athlete/plan/repository";
import { requireRoleAuth } from "@/lib/errors/require-role-auth";
import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import type { ActualSet, WorkoutPlan } from "@/lib/plans/workout-plan";
import { revalidatePath } from "next/cache";

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

  const saved = await saveWorkoutSetActuals({
    assignmentId,
    plan: assignment.plan,
    weekPos,
    dayPos,
    exercisePos,
    setPos,
    actual,
  });
  if (!saved.ok) return saved;
  if (saved.maxChanged) {
    revalidatePath("/athlete");
    revalidatePath("/athlete/maxes");
    revalidatePath(`/coach/athletes/${auth.user.id}`);
  }
  return { ok: true };
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
