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
import type { ActualSet } from "@/lib/plans/workout-plan";

export type SaveSetActualsActionResult = ServiceResult<Record<never, never>>;

export type CompleteDayActionResult = ServiceResult<{
  nextDayIdx: number | null;
  allDaysDone: boolean;
}>;

export async function saveSetActualsAction(
  assignmentId: string,
  weekIdx: number,
  dayIdx: number,
  exerciseIdx: number,
  setIdx: number,
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
    weekIdx,
    dayIdx,
    exerciseIdx,
    setIdx,
    actual,
  );

  return savePlanActuals(assignmentId, updatedPlan);
}

export async function completeDayAction(
  assignmentId: string,
  weekIdx: number,
  dayIdx: number,
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
    weekIdx,
    dayIdx,
  );

  if (!completeResult.ok) {
    return completeResult;
  }

  const { allDaysDone, plan } = completeResult;

  if (allDaysDone) {
    return { ok: true, nextDayIdx: null, allDaysDone: true };
  }

  const nextDay = findNextDayAfter(plan, weekIdx, dayIdx);

  return {
    ok: true,
    nextDayIdx: nextDay?.dayIndex ?? null,
    allDaysDone: false,
  };
}
