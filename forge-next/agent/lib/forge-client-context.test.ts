import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";
import { buildForgeClientContext } from "@/lib/chat/adapters/plan/forge-client-context";

const { getCoachArtifact, setCoachArtifact } = vi.hoisted(() => ({
  getCoachArtifact: vi.fn(),
  setCoachArtifact: vi.fn(),
}));

vi.mock("./coach-artifact-state", () => ({
  coachArtifact: {
    get: getCoachArtifact,
  },
  setCoachArtifact,
}));

import {
  parseForgeClientContextMessage,
  syncCoachArtifactFromClientContext,
} from "./forge-client-context";

describe("forge client context sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCoachArtifact.mockReturnValue({
      plan: null,
      planId: null,
      title: "",
    });
  });

  it("parses forge client context messages", () => {
    const plan = createEmptyWorkoutPlan();
    const payload = buildForgeClientContext({
      forgeSessionId: "session-1",
      clientArtifact: {
        plan,
        planId: "plan-1",
        title: "Draft",
      },
    });

    expect(
      parseForgeClientContextMessage(
        `Client context:\n${JSON.stringify(payload)}`,
      ),
    ).toEqual(payload);
  });

  it("updates coachArtifact when the client artifact differs", () => {
    const plan = createEmptyWorkoutPlan();

    syncCoachArtifactFromClientContext(
      buildForgeClientContext({
        forgeSessionId: "session-1",
        clientArtifact: {
          plan,
          planId: "plan-1",
          title: "Draft",
        },
      }),
    );

    expect(setCoachArtifact).toHaveBeenCalledWith({
      plan,
      planId: "plan-1",
      title: "Draft",
    });
  });
});
