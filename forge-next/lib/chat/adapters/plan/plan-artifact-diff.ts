import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ClientArtifactSnapshot = {
  plan: WorkoutPlan;
  planId: string | null;
  title: string;
};

function stablePlanJson(plan: WorkoutPlan): string {
  return JSON.stringify(plan);
}

export function clientArtifactDiffers(
  left: ClientArtifactSnapshot | null,
  right: ClientArtifactSnapshot | null,
): boolean {
  if (left === null && right === null) {
    return false;
  }

  if (left === null || right === null) {
    return true;
  }

  return (
    left.planId !== right.planId ||
    left.title !== right.title ||
    stablePlanJson(left.plan) !== stablePlanJson(right.plan)
  );
}

export function resolveEffectiveClientArtifact(input: {
  agentArtifact: WorkoutPlan | null;
  agentPlanId: string | null;
  agentTitle: string;
  localArtifact: WorkoutPlan | null;
  localPlanId: string | null;
  localTitle: string;
}): ClientArtifactSnapshot | null {
  const plan = input.agentArtifact ?? input.localArtifact;
  if (!plan) {
    return null;
  }

  return {
    plan,
    planId: input.agentArtifact ? input.agentPlanId : input.localPlanId,
    title: input.agentArtifact
      ? input.agentTitle || plan.name
      : input.localTitle || plan.name,
  };
}
