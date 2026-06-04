import { describe, expect, it, vi } from "vitest";
import { runPlanChat } from "@/lib/ai/plan-chat/orchestrator";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";

function mockStreamText(options: {
  text?: string;
  submitPython?: string;
}) {
  return {
    textStream: (async function* () {
      if (options.text) {
        yield options.text;
      }
    })(),
    then(resolve: (value: unknown) => void) {
      if (options.submitPython && options.tools?.submit_plan_code?.execute) {
        void options.tools.submit_plan_code.execute(
          { python: options.submitPython },
          { messages: [], toolCallId: "test" },
        );
      }
      resolve({});
      return Promise.resolve();
    },
    tools: options.tools,
  };
}

describe("runPlanChat", () => {
  it("ends at done without sandbox when submit_plan_code is not called", async () => {
    const events: { type: string; status?: string }[] = [];
    const runSandbox = vi.fn();

    await runPlanChat(
      {
        coachId: "coach-1",
        draftId: "draft-1",
        prompt: "Which sheet?",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listDrafts: async () => [
          { path: "coach-1/draft-1/a__s.txt", name: "a__s.txt", sizeBytes: 1 },
          { path: "coach-1/draft-1/a__v.txt", name: "a__v.txt", sizeBytes: 2 },
        ],
        streamTextFn: (opts) => mockStreamText({ text: "Which sheet?", tools: opts.tools }),
        runSandbox,
      },
    );

    expect(runSandbox).not.toHaveBeenCalled();
    expect(events.some((e) => e.type === "artifact")).toBe(false);
    expect(events.filter((e) => e.type === "runStatus").at(-1)).toEqual({
      type: "runStatus",
      status: "done",
    });
  });

  it("runs sandbox only after submit_plan_code", async () => {
    const events: unknown[] = [];
    const runSandbox = vi.fn().mockResolvedValue({
      ok: true,
      plan: buildMinimalWorkoutPlan(),
    });

    await runPlanChat(
      {
        coachId: "coach-1",
        prompt: "Build plan",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listDrafts: async () => [],
        streamTextFn: (opts) =>
          mockStreamText({
            text: "Building…",
            submitPython: "print('plan')",
            tools: opts.tools,
          }),
        runSandbox,
      },
    );

    expect(runSandbox).toHaveBeenCalledWith({
      currentPlan: null,
      generatedPython: "print('plan')",
    });
    expect(events.some((e) => (e as { type?: string }).type === "artifact")).toBe(
      true,
    );
  });

  it("returns gateway error when not configured", async () => {
    const events: unknown[] = [];
    await runPlanChat(
      {
        coachId: "coach-1",
        prompt: "hi",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      { isGatewayConfigured: () => false },
    );

    expect(events).toContainEqual({
      type: "errors",
      errors: [
        {
          code: "GATEWAY_NOT_CONFIGURED",
          message: "AI Gateway is not configured (AI_GATEWAY_API_KEY).",
        },
      ],
    });
  });
});
