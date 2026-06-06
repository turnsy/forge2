import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type SavePlanClientResult =
  | { ok: true; planId: string; versionId: string }
  | { ok: false; message: string };

export async function createCoachPlanClient(input: {
  plan: WorkoutPlan;
  title: string;
}): Promise<SavePlanClientResult> {
  const response = await fetch("/api/coach/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan: input.plan,
      title: input.title,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    return {
      ok: false,
      message: body?.error ?? "Failed to save plan",
    };
  }

  const body = (await response.json()) as {
    planId: string;
    versionId: string;
  };

  return {
    ok: true,
    planId: body.planId,
    versionId: body.versionId,
  };
}

export async function saveCoachPlanVersionClient(input: {
  planId: string;
  plan: WorkoutPlan;
  title: string;
}): Promise<SavePlanClientResult> {
  const response = await fetch(`/api/coach/plans/${input.planId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan: input.plan,
      title: input.title,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    return {
      ok: false,
      message: body?.error ?? "Failed to save plan",
    };
  }

  const body = (await response.json()) as { versionId: string };

  return {
    ok: true,
    planId: input.planId,
    versionId: body.versionId,
  };
}
