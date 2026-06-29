import { describe, expect, it } from "vitest";
import { buildForgeClientContext } from "@/lib/chat/adapters/plan/forge-client-context";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

describe("buildForgeClientContext", () => {
  it("builds a tagged forge client context payload", () => {
    const plan = createEmptyWorkoutPlan();

    expect(
      buildForgeClientContext({
        forgeSessionId: "session-1",
        clientArtifact: {
          plan,
          planId: "plan-1",
          title: "Draft",
        },
      }),
    ).toEqual({
      forge: "forge",
      forgeSessionId: "session-1",
      clientArtifact: {
        plan,
        planId: "plan-1",
        title: "Draft",
      },
    });
  });
});
