"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  applySetActuals,
  findNextDayAfter,
} from "@/lib/athlete/plan/domain";
import {
  completeDay,
  getAssignedPlanById,
  savePlanActuals,
} from "@/lib/athlete/plan/repository";
import type { ActualSet } from "@/lib/plans/workout-plan";

export async function saveSetActualsAction(
  assignmentId: string,
  weekIdx: number,
  dayIdx: number,
  exerciseIdx: number,
  setIdx: number,
  actual: ActualSet | null,
): Promise<void> {
  const user = await requireRole("athlete");
  const assignment = await getAssignedPlanById(assignmentId);

  if (!assignment || assignment.athleteId !== user.id) {
    throw new Error("Assignment not found");
  }

  const updatedPlan = applySetActuals(
    assignment.plan,
    weekIdx,
    dayIdx,
    exerciseIdx,
    setIdx,
    actual,
  );

  await savePlanActuals(assignmentId, updatedPlan);
  revalidatePath("/athlete/plan");
}

export async function completeDayAction(
  assignmentId: string,
  weekIdx: number,
  dayIdx: number,
): Promise<{ nextDayIdx: number | null; allDaysDone: boolean }> {
  const user = await requireRole("athlete");
  const assignment = await getAssignedPlanById(assignmentId);

  if (!assignment || assignment.athleteId !== user.id) {
    throw new Error("Assignment not found");
  }

  const { allDaysDone, plan } = await completeDay(
    assignmentId,
    assignment.plan,
    weekIdx,
    dayIdx,
  );

  revalidatePath("/athlete/plan");
  revalidatePath("/athlete");

  if (allDaysDone) {
    return { nextDayIdx: null, allDaysDone: true };
  }

  const nextDay = findNextDayAfter(plan, weekIdx, dayIdx);

  return {
    nextDayIdx: nextDay?.dayIndex ?? null,
    allDaysDone: false,
  };
}
