"use client";

import { useSaveArtifact } from "@/lib/chat/use-save-artifact";
import { saveAssignedPlanAction } from "@/lib/coach/assigned-plan/actions";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type { SaveArtifactStatus as SaveAssignedPlanStatus } from "@/lib/chat/use-save-artifact";

export function useSaveAssignedPlan(assignmentId: string) {
  const { save, ...rest } = useSaveArtifact<
    { plan: WorkoutPlan },
    Record<never, never>
  >({
    successStatus: "saved",
    save: async (input) => {
      const result = await saveAssignedPlanAction(assignmentId, input.plan);

      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      return { ok: true, value: {} };
    },
  });

  return {
    ...rest,
    saveAssignedPlan: save,
  };
}
