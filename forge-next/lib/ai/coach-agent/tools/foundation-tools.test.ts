import { describe, expect, it } from "vitest";
import { createFoundationTools } from "@/lib/ai/coach-agent/tools/foundation-tools";

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
              name: "Back Squat",
              sets: [
                {
                  id: "w1d1-bs-1",
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

describe("createFoundationTools", () => {
  it("get_plan_codegen_guide returns non-empty guide", async () => {
    const tools = createFoundationTools({ currentArtifact: null });
    const result = await tools.get_plan_codegen_guide.execute!({}, toolCtx);

    expect(result.guide.length).toBeGreaterThan(100);
    expect(result.guide).toContain("submit_plan_code");
    expect(result.guide).toContain("forge_plan");
  });

  it("summarize_current_artifact returns null when no artifact", async () => {
    const tools = createFoundationTools({ currentArtifact: null });
    const result = await tools.summarize_current_artifact.execute!({}, toolCtx);

    expect(result).toEqual({
      summary: null,
      message: "No plan in preview.",
    });
  });

  it("summarize_current_artifact returns summary when artifact present", async () => {
    const tools = createFoundationTools({ currentArtifact: samplePlan });
    const result = await tools.summarize_current_artifact.execute!({}, toolCtx);

    expect(result.summary).toContain("Summer Block");
    expect(result.summary).not.toContain('"weeks"');
  });
});
