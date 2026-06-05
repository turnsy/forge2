import { describe, expect, it } from "vitest";
import { buildPlanChatSystemPrompt } from "@/lib/ai/plan-chat/prompts/system-prompts";

const samplePlan = {
  schemaVersion: "2.0.0" as const,
  name: "Unique Plan Name XYZ",
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

describe("buildPlanChatSystemPrompt", () => {
  it("includes summarize text but not full artifact JSON", () => {
    const system = buildPlanChatSystemPrompt({
      currentArtifact: samplePlan,
      hasDraftUploads: true,
    });
    expect(system).toContain("Unique Plan Name XYZ");
    expect(system).not.toContain('"weeks":');
    expect(system).not.toContain(JSON.stringify(samplePlan));
  });

  it("documents forge_plan validation rules including day codes", () => {
    const system = buildPlanChatSystemPrompt({
      currentArtifact: null,
      hasDraftUploads: false,
    });
    expect(system).toContain("w1d1");
    expect(system).toContain("W1D1");
    expect(system).toContain("^w[0-9]+d[0-9]+$");
  });

  it("requires full program scope in one submit_plan_code when user specifies weeks", () => {
    const system = buildPlanChatSystemPrompt({
      currentArtifact: null,
      hasDraftUploads: false,
    });
    expect(system).toContain("full requested structure");
    expect(system).not.toContain("Stay short");
    expect(system).toContain("multi-week block");
  });

  it("documents integer reps and notes for coaching qualifiers", () => {
    const system = buildPlanChatSystemPrompt({
      currentArtifact: null,
      hasDraftUploads: false,
    });
    expect(system).toContain("Reps and notes");
    expect(system).toContain("plain integer count");
    expect(system).toContain('add_set(notes=...)');
    expect(system).toContain("3/side");
  });

  it("constrains assistant replies to one short sentence without implementation jargon", () => {
    const system = buildPlanChatSystemPrompt({
      currentArtifact: null,
      hasDraftUploads: false,
    });
    expect(system).toContain("Assistant reply style");
    expect(system).toContain("one short plain-language sentence");
    expect(system).toContain("no markdown headings or bullet lists");
    expect(system).toContain("Do not mention workspace, sandbox, JSON");
    expect(system).toContain(
      "Do not recap program structure, weekly splits, progression",
    );
  });
});
