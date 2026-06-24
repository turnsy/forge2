import { describe, expect, it } from "vitest";
import { makeWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { createFoundationTools } from "@/lib/ai/coach-agent/tools/foundation-tools";

const toolCtx = { messages: [], toolCallId: "1" };

const samplePlan = makeWorkoutPlan({ name: "Summer Block" });

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

  it("summarize_current_artifact returns set detail for week and day", async () => {
    const tools = createFoundationTools({ currentArtifact: samplePlan });
    const result = await tools.summarize_current_artifact.execute!(
      { week: 0, day: 0 },
      toolCtx,
    );

    expect(result.summary).toContain("Back Squat:");
    expect(result.summary).toContain("@");
  });
});
