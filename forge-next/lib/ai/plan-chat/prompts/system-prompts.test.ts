import { describe, expect, it } from "vitest";
import { buildCoachAgentSystemPrompt } from "@/lib/ai/plan-chat/prompts/system-prompts";

describe("buildCoachAgentSystemPrompt", () => {
  it("is a high-level routing guide without inline codegen or plan summary", () => {
    const system = buildCoachAgentSystemPrompt({
      hasSessionUploads: true,
    });
    expect(system).toContain("Tool routing:");
    expect(system).toContain("get_plan_codegen_guide");
    expect(system).toContain("summarize_current_artifact");
    expect(system).toContain("set_current_artifact");
    expect(system).not.toContain("Existing plan summary:");
    expect(system).not.toContain("Cheat sheet:");
    expect(system).not.toContain("^w[0-9]+d[0-9]+$");
  });

  it("requires codegen guide before submit_plan_code", () => {
    const system = buildCoachAgentSystemPrompt({
      hasSessionUploads: false,
    });
    expect(system).toContain(
      "You MUST call get_plan_codegen_guide before any submit_plan_code",
    );
  });

  it("documents set_current_artifact for saved-plan edit only", () => {
    const system = buildCoachAgentSystemPrompt({
      hasSessionUploads: false,
    });
    expect(system).toContain("set_current_artifact is NOT used for fresh plan creation");
    expect(system).toContain("get_plan and assign_plan do NOT set the preview");
  });

  it("constrains assistant replies to one short sentence without implementation jargon", () => {
    const system = buildCoachAgentSystemPrompt({
      hasSessionUploads: false,
    });
    expect(system).toContain("Assistant reply style");
    expect(system).toContain("one short plain-language sentence");
    expect(system).toContain("Do not mention workspace, sandbox, JSON");
  });

  it("notes when no session uploads exist", () => {
    const system = buildCoachAgentSystemPrompt({
      hasSessionUploads: false,
    });
    expect(system).toContain("No session uploads are registered");
  });
});
