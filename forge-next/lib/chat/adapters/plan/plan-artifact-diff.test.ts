import { describe, expect, it } from "vitest";
import {
  clientArtifactDiffers,
  resolveAgentClientArtifact,
  resolveEffectiveClientArtifact,
  resolveOutboundClientArtifact,
} from "@/lib/chat/adapters/plan/plan-artifact-diff";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

describe("plan artifact diff helpers", () => {
  const plan = createEmptyWorkoutPlan();

  it("prefers the local artifact for display when both local and agent artifacts exist", () => {
    const resolved = resolveEffectiveClientArtifact({
      agentArtifact: { ...plan, name: "Agent Plan" },
      agentPlanId: "plan-1",
      agentTitle: "Agent Plan",
      localArtifact: { ...plan, name: "Local Plan" },
      localPlanId: null,
      localTitle: "Local Plan",
    });

    expect(resolved).toEqual({
      plan: { ...plan, name: "Local Plan" },
      planId: "plan-1",
      title: "Local Plan",
    });
  });

  it("falls back to the agent artifact when no local copy exists", () => {
    const resolved = resolveEffectiveClientArtifact({
      agentArtifact: { ...plan, name: "Agent Plan" },
      agentPlanId: "plan-1",
      agentTitle: "Agent Plan",
      localArtifact: null,
      localPlanId: null,
      localTitle: "",
    });

    expect(resolved).toEqual({
      plan: { ...plan, name: "Agent Plan" },
      planId: "plan-1",
      title: "Agent Plan",
    });
  });

  it("falls back to the local artifact before the first agent tool result", () => {
    const resolved = resolveEffectiveClientArtifact({
      agentArtifact: null,
      agentPlanId: null,
      agentTitle: "",
      localArtifact: plan,
      localPlanId: "plan-1",
      localTitle: "Draft",
    });

    expect(resolved).toEqual({
      plan,
      planId: "plan-1",
      title: "Draft",
    });
  });

  it("detects artifact snapshot differences", () => {
    expect(
      clientArtifactDiffers(
        { plan, planId: null, title: "Draft" },
        { plan: { ...plan, name: "Changed" }, planId: null, title: "Changed" },
      ),
    ).toBe(true);
  });

  it("omits outbound client context when local matches the agent artifact", () => {
    const snapshot = {
      agentArtifact: { ...plan, name: "Agent Plan" },
      agentPlanId: "plan-1",
      agentTitle: "Agent Plan",
      localArtifact: { ...plan, name: "Agent Plan" },
      localPlanId: "plan-1",
      localTitle: "Agent Plan",
    };

    expect(resolveAgentClientArtifact(snapshot)).toEqual({
      plan: { ...plan, name: "Agent Plan" },
      planId: "plan-1",
      title: "Agent Plan",
    });
    expect(resolveOutboundClientArtifact(snapshot)).toBeNull();
  });

  it("includes outbound client context when local edits diverge", () => {
    expect(
      resolveOutboundClientArtifact({
        agentArtifact: { ...plan, name: "Agent Plan" },
        agentPlanId: "plan-1",
        agentTitle: "Agent Plan",
        localArtifact: { ...plan, name: "Edited Plan" },
        localPlanId: "plan-1",
        localTitle: "Edited Plan",
      }),
    ).toEqual({
      plan: { ...plan, name: "Edited Plan" },
      planId: "plan-1",
      title: "Edited Plan",
    });
  });
});
