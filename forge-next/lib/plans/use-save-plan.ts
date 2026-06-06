"use client";

import { useCallback, useState } from "react";
import {
  createCoachPlanClient,
  saveCoachPlanVersionClient,
} from "@/lib/plans/save-plan-client";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function useSavePlan(planId: string | null) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const savePlan = useCallback(
    async (input: {
      plan: WorkoutPlan;
      title: string;
    }): Promise<{ planId: string; versionId: string } | null> => {
      setIsSaving(true);
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

      setIsSaving(false);

      if (!result.ok) {
        setSaveError(result.message);
        return null;
      }

      return {
        planId: result.planId,
        versionId: result.versionId,
      };
    },
    [planId],
  );

  return {
    isSaving,
    saveError,
    savePlan,
    clearSaveError: useCallback(() => setSaveError(null), []),
  };
}
