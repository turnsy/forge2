import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ClientArtifactSnapshot = {
  plan: WorkoutPlan;
  planId: string | null;
  title: string;
};

export function stablePlanJson(plan: WorkoutPlan): string {
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

export function resolveAgentClientArtifact(input: {
  agentArtifact: WorkoutPlan | null;
  agentPlanId: string | null;
  agentTitle: string;
}): ClientArtifactSnapshot | null {
  if (!input.agentArtifact) {
    return null;
  }

  return {
    plan: input.agentArtifact,
    planId: input.agentPlanId,
    title: input.agentTitle || input.agentArtifact.name,
  };
}

/** Coach-editable artifact for display and outbound client context. */
export function resolveEffectiveClientArtifact(input: {
  agentArtifact: WorkoutPlan | null;
  agentPlanId: string | null;
  agentTitle: string;
  localArtifact: WorkoutPlan | null;
  localPlanId: string | null;
  localTitle: string;
}): ClientArtifactSnapshot | null {
  const usingLocal = input.localArtifact !== null;
  const plan = input.localArtifact ?? input.agentArtifact;
  if (!plan) {
    return null;
  }

  return {
    plan,
    planId: usingLocal
      ? input.localPlanId ?? input.agentPlanId
      : input.agentPlanId,
    title: usingLocal
      ? input.localTitle || plan.name
      : input.agentTitle || plan.name,
  };
}

/** Returns the client artifact to send when local edits diverge from Eve state. */
export function resolveOutboundClientArtifact(input: {
  agentArtifact: WorkoutPlan | null;
  agentPlanId: string | null;
  agentTitle: string;
  localArtifact: WorkoutPlan | null;
  localPlanId: string | null;
  localTitle: string;
}): ClientArtifactSnapshot | null {
  const agentSnapshot = resolveAgentClientArtifact(input);
  const clientSnapshot = resolveEffectiveClientArtifact(input);

  if (!clientSnapshot) {
    return null;
  }

  return clientArtifactDiffers(agentSnapshot, clientSnapshot)
    ? clientSnapshot
    : null;
}
