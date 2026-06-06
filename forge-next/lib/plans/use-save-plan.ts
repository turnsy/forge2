"use client";

import { useCallback, useState } from "react";
import {
  createCoachPlanClient,
  saveCoachPlanVersionClient,
} from "@/lib/plans/save-plan-client";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type SavePlanStatus = "idle" | "saving" | "saved";

export function useSavePlan(planId: string | null) {
  const [saveStatus, setSaveStatus] = useState<SavePlanStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const savePlan = useCallback(
    async (input: {
      plan: WorkoutPlan;
      title: string;
    }): Promise<{ planId: string; versionId: string } | null> => {
      setSaveStatus("saving");
      setSaveError(null);

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
        setSaveStatus("idle");
        setSaveError(result.message);
        return null;
      }

      setSaveStatus(planId ? "saved" : "saving");

      return {
        planId: result.planId,
        versionId: result.versionId,
      };
    },
    [planId],
  );

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
    setSaveError(null);
  }, []);

  return {
    saveStatus,
    saveError,
    savePlan,
    resetSaveStatus,
  };
}
