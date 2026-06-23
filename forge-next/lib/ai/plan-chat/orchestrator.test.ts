import { describe, expect, it, vi } from "vitest";
import { runPlanChat } from "@/lib/ai/plan-chat/orchestrator";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";

function mockStreamText(options: {
  text?: string;
  submitPython?: string;
  clearArtifact?: boolean;
  tools?: {
    submit_plan_code?: {
      execute: (
        input: { python: string },
        context: { messages: unknown[]; toolCallId: string },
      ) => Promise<unknown>;
    };
    clear_current_artifact?: {
      execute: (
        input: Record<string, never>,
        context: { messages: unknown[]; toolCallId: string },
      ) => Promise<unknown>;
    };
  };
}) {
  return {
    textStream: (async function* () {
      if (options.text) {
        yield options.text;
      }
    })(),
    then(resolve: (value: unknown) => void) {
      return (async () => {
        if (options.clearArtifact && options.tools?.clear_current_artifact?.execute) {
          await options.tools.clear_current_artifact.execute(
            {},
            { messages: [], toolCallId: "test" },
          );
        }
        if (options.submitPython && options.tools?.submit_plan_code?.execute) {
          await options.tools.submit_plan_code.execute(
            { python: options.submitPython },
            { messages: [], toolCallId: "test" },
          );
        }
        resolve({});
      })();
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
        sessionId: "session-1",
        prompt: "Which sheet?",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listSessionUploads: async () => [
          { path: "coach-1/session-1/a__s.txt", name: "a__s.txt", sizeBytes: 1 },
          { path: "coach-1/session-1/a__v.txt", name: "a__v.txt", sizeBytes: 2 },
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

  it("emits clearArtifact when clear_current_artifact is called", async () => {
    const events: { type: string }[] = [];
    const runSandbox = vi.fn();

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: "Start a new plan",
        messages: [],
        currentArtifact: buildMinimalWorkoutPlan(),
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listSessionUploads: async () => [],
        streamTextFn: (opts) =>
          mockStreamText({
            text: "Starting fresh.",
            clearArtifact: true,
            tools: opts.tools,
          }),
        runSandbox,
      },
    );

    expect(runSandbox).not.toHaveBeenCalled();
    expect(events).toContainEqual({ type: "clearArtifact" });
    expect(events.filter((e) => e.type === "runStatus").at(-1)).toEqual({
      type: "runStatus",
      status: "done",
    });
  });

  it("emits artifact when submit_plan_code succeeds during the tool loop", async () => {
    const events: unknown[] = [];
    const plan = buildMinimalWorkoutPlan();
    const runSandbox = vi.fn().mockResolvedValue({
      ok: true,
      plan,
    });

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: "Build plan",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listSessionUploads: async () => [],
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
      artifact: {
        type: "plan",
        currentPlan: null,
        generatedPython: "print('plan')",
      },
    });
    expect(events.some((e) => (e as { type?: string }).type === "artifact")).toBe(
      true,
    );
    expect(events.filter((e) => (e as { type?: string }).type === "runStatus").at(-1)).toEqual({
      type: "runStatus",
      status: "done",
    });
  });

  it("emits errors without artifact when sandbox output fails validation", async () => {
    const events: unknown[] = [];
    const runSandbox = vi.fn().mockResolvedValue({
      ok: true,
      plan: { schemaVersion: "1.0.0", name: "Invalid" },
    });

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: "Build plan",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listSessionUploads: async () => [],
        streamTextFn: (opts) =>
          mockStreamText({
            submitPython: "print('bad')",
            tools: opts.tools,
          }),
        runSandbox,
      },
    );

    expect(events.some((e) => (e as { type?: string }).type === "artifact")).toBe(
      false,
    );
    expect(events).toContainEqual(
      expect.objectContaining({ type: "errors" }),
    );
    expect(events.filter((e) => (e as { type?: string }).type === "runStatus").at(-1)).toEqual({
      type: "runStatus",
      status: "error",
    });
  });

  it("emits errors without artifact when sandbox fails", async () => {
    const events: unknown[] = [];
    const runSandbox = vi.fn().mockResolvedValue({
      ok: false,
      code: "SANDBOX_TIMEOUT",
      message: "Sandbox timed out.",
    });

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: "Build plan",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listSessionUploads: async () => [],
        streamTextFn: (opts) =>
          mockStreamText({
            submitPython: "print('plan')",
            tools: opts.tools,
          }),
        runSandbox,
      },
    );

    expect(events.some((e) => (e as { type?: string }).type === "artifact")).toBe(
      false,
    );
    expect(events).toContainEqual({
      type: "errors",
      errors: [{ code: "SANDBOX_TIMEOUT", message: "Sandbox timed out." }],
    });
    expect(events.filter((e) => (e as { type?: string }).type === "runStatus").at(-1)).toEqual({
      type: "runStatus",
      status: "error",
    });
  });

  it("clears last submit errors when a later submit succeeds", async () => {
    const events: unknown[] = [];
    const plan = buildMinimalWorkoutPlan();
    const runSandbox = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        code: "SANDBOX_FAILED",
        message: "SyntaxError",
      })
      .mockResolvedValueOnce({ ok: true, plan });

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: "Build plan",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        listSessionUploads: async () => [],
        streamTextFn: (opts) => ({
          textStream: (async function* () {
            yield "";
          })(),
          then(resolve: (value: unknown) => void) {
            return (async () => {
              await opts.tools?.submit_plan_code?.execute!(
                { python: "bad(" },
                { messages: [], toolCallId: "1" },
              );
              await opts.tools?.submit_plan_code?.execute!(
                { python: "print('plan')" },
                { messages: [], toolCallId: "2" },
              );
              resolve({});
            })();
          },
          tools: opts.tools,
        }),
        runSandbox,
      },
    );

    expect(events.some((e) => (e as { type?: string }).type === "artifact")).toBe(
      true,
    );
    expect(events.filter((e) => (e as { type?: string }).type === "runStatus").at(-1)).toEqual({
      type: "runStatus",
      status: "done",
    });
  });

  it("returns gateway error when not configured", async () => {
    const events: unknown[] = [];
    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
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
