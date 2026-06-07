import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPlan = vi.fn();

vi.mock("@/lib/plans/repository", () => ({
  getCoachPlanById: (...args: unknown[]) => mockGetPlan(...args),
}));

import { createArtifactTools } from "@/lib/ai/coach-agent/tools/artifact-tools";

const toolCtx = { messages: [], toolCallId: "1" };

const samplePlan = {
  schemaVersion: "2.0.0" as const,
  name: "Summer Block",
  weeks: [
    {
      index: 1,
      days: [
        {
          index: 1,
          code: "w1d1",
          exercises: [
            {
              name: "Squat",
              sets: [
                {
                  id: "w1d1-sq-1",
                  planned: {
                    type: "exact" as const,
                    reps: 5,
                    load: { type: "absolute" as const, value: 100, unit: "kg" as const },
                  },
                  actual: null,
                  status: "planned" as const,
                  locked: false,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

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
});
