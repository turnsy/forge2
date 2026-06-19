"use server";

import {
  getAssignedPlanById,
  savePlanActuals,
} from "@/lib/athlete/plan/repository";
import { requireRoleAuth } from "@/lib/errors/require-role-auth";
import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type SaveAssignedPlanActionResult = ServiceResult<Record<never, never>>;

export async function saveAssignedPlanAction(
  assignmentId: string,
  planData: WorkoutPlan,
): Promise<SaveAssignedPlanActionResult> {
  const auth = await requireRoleAuth("coach");
  if (!auth.ok) {
    return auth;
  }

  const assignmentResult = await getAssignedPlanById(assignmentId);
  if (!assignmentResult.ok) {
    return assignmentResult;
  }

  const assignment = assignmentResult.plan;
  if (!assignment || assignment.coachId !== auth.user.id) {
    return serviceError(
      ServiceErrorCode.NOT_FOUND,
      "Assignment not found or access denied",
    );
  }

  if (assignment.status !== "active") {
    return serviceError(
      ServiceErrorCode.VALIDATION_ERROR,
      "Only active assignments can be edited",
    );
  }

  return savePlanActuals(assignmentId, planData);
}
