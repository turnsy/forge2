"use client";

import { useMemo } from "react";
import { useSaveArtifact } from "@/lib/chat/use-save-artifact";
import {
  createCoachPlanClient,
  saveCoachPlanVersionClient,
} from "@/lib/plans/save-plan-client";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type { SaveArtifactStatus as SavePlanStatus } from "@/lib/chat/use-save-artifact";

export function useSavePlan(planId: string | null) {
  const successStatus = useMemo(
    () => (planId ? ("saved" as const) : ("saving" as const)),
    [planId],
  );

  const { save, ...rest } = useSaveArtifact<
    { plan: WorkoutPlan; title: string },
    { planId: string; versionId: string }
  >({
    successStatus,
    save: async (input) => {
      const result = planId
        ? await saveCoachPlanVersionClient({
            planId,
            plan: input.plan,
            title: input.title,
          })
        : await createCoachPlanClient({
            plan: input.plan,
            title: input.title,
          });

      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      return {
        ok: true,
        value: {
          planId: result.planId,
          versionId: result.versionId,
        },
      };
    },
  });

  return {
    ...rest,
    savePlan: save,
  };
}
