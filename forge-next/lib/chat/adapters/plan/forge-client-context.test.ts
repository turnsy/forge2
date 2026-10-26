import { describe, expect, it } from "vitest";
import { buildForgeClientContext, prepareForgeClientSend } from "@/lib/chat/adapters/plan/forge-client-context";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

describe("buildForgeClientContext", () => {
  it("keeps normal message context but omits it from input-only responses", () => {
    const context = { forgeSessionId: "forge-1" };
    expect(prepareForgeClientSend({ message: "Build a plan" }, context).clientContext).toMatchObject(context);
    expect(prepareForgeClientSend({ inputResponses: [{ requestId: "question-1", text: "Jay" }], clientContext: "old context" }, context).clientContext).toBeUndefined();
  });
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
