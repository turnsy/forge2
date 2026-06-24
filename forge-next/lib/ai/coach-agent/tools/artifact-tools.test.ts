import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockGetPlan = vi.fn();

vi.mock("@/lib/plans/repository", () => ({
  getCoachPlanById: (...args: unknown[]) => mockGetPlan(...args),
}));

import { createArtifactTools } from "@/lib/ai/coach-agent/tools/artifact-tools";

const toolCtx = { messages: [], toolCallId: "1" };

const samplePlan = makeWorkoutPlan({ name: "Summer Block" });

describe("createArtifactTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads plan and returns summary without blob", async () => {
    const onSetCurrentArtifact = vi.fn();
    mockGetPlan.mockResolvedValue({
      status: "ok",
      detail: {
        id: "plan-1",
        createdAt: "2026-01-01T00:00:00Z",
        plan: samplePlan,
      },
    });

    const tools = createArtifactTools({
      coachId: "coach-1",
      onSetCurrentArtifact,
      onClearCurrentArtifact: () => {},
    });
    const result = await tools.set_current_artifact.execute!(
      { planId: "plan-1" },
      toolCtx,
    );

    expect(onSetCurrentArtifact).toHaveBeenCalledWith({
      planId: "plan-1",
      plan: samplePlan,
      title: "Summer Block",
    });
    expect(result).toMatchObject({
      ok: true,
      planId: "plan-1",
      name: "Summer Block",
    });
    if ("summary" in result && result.ok) {
      expect(result.summary).toContain("Summer Block");
      expect(result.summary).not.toContain('"weeks"');
    }
  });

  it("clears artifact on clear_current_artifact", async () => {
    const onClearCurrentArtifact = vi.fn();
    const tools = createArtifactTools({
      coachId: "coach-1",
      onSetCurrentArtifact: () => {},
      onClearCurrentArtifact,
    });

    const result = await tools.clear_current_artifact.execute!({}, toolCtx);

    expect(onClearCurrentArtifact).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ok: true,
      message: "Current plan cleared. Ready for a new plan.",
    });
  });
});
