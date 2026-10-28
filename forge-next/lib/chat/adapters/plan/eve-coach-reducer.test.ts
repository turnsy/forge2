import { describe, expect, it } from "vitest";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import type { HandleMessageStreamEvent, InputRequest } from "eve/client";

describe("createEveCoachReducer", () => {
  const reducer = createEveCoachReducer();

  it("only requests showing the artifact for a successful explicit show tool", () => {
    const event = (toolName: string, output: { ok: boolean } | { ok: boolean; plan: { name: string } }): HandleMessageStreamEvent => ({
      type: "action.result", data: { sequence: 1, turnId: "turn", stepIndex: 0, status: "completed", result: { kind: "tool-result", toolName, callId: "call", output } },
    });
    let state = reducer.initial();
    state = reducer.reduce(state, event("set_current_artifact", { ok: true, plan: { name: "Plan" } }));
    expect(state.artifactShowRequest ?? 0).toBe(0);
    state = reducer.reduce(state, event("show_current_artifact", { ok: false }));
    expect(state.artifactShowRequest ?? 0).toBe(0);
    state = reducer.reduce(state, event("show_current_artifact", { ok: true }));
    expect(state.artifactShowRequest).toBe(1);
    state = reducer.reduce(state, event("show_current_artifact", { ok: true }));
    expect(state.artifactShowRequest).toBe(2);
  });

  it("clears stale approvals when a Gateway failure terminates the session", () => {
    const request: InputRequest = {
      requestId: "approval-1", prompt: "Assign this plan?", display: "confirmation",
      action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {} },
    };
    const state = reducer.reduce({ ...reducer.initial(), pendingInputRequests: [request] }, {
      type: "session.failed", data: { code: "MODEL_CALL_FAILED", sessionId: "eve-1", message: "AI Gateway rejected the model request before the agent produced a response." },
    });
    expect(state.pendingInputRequests).toEqual([]);
    expect(state.phase).toBe("error");
    expect(state.errors[0].message).toContain("AI Gateway rejected");
  });

  it("replaces an answered question with the next approval batch during replay", () => {
    const question: InputRequest = {
      requestId: "question-1", prompt: "Which Jay?", display: "select",
      action: { kind: "tool-call", callId: "question-1", toolName: "ask_question", input: {} },
    };
    const approval: InputRequest = {
      requestId: "approval-1", prompt: "Assign this plan?", display: "confirmation",
      action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {} },
    };
    let state: ReturnType<typeof reducer.initial> = { ...reducer.initial(), pendingInputRequests: [question] };
    state = reducer.reduce(state, { type: "turn.started", data: { turnId: "turn-2", sequence: 2 } });
    expect(state.pendingInputRequests).toEqual([]);
    state = reducer.reduce(state, { type: "input.requested", data: { turnId: "turn-2", sequence: 2, stepIndex: 0, requests: [approval] } });
    expect(state.pendingInputRequests).toEqual([approval]);
  });

  it("restores pending approval on replay and clears it only when its tool resolves", () => {
    const request: InputRequest = {
      requestId: "approval-1", prompt: "Assign this plan?", display: "confirmation",
      options: [{ id: "approve", label: "Approve" }, { id: "deny", label: "Deny" }],
      action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {} },
    };
    const events: HandleMessageStreamEvent[] = [
      { type: "input.requested", data: { requests: [request], sequence: 1, stepIndex: 0, turnId: "turn-1" } },
      { type: "session.waiting", data: { wait: "next-user-message" } },
    ];
    let state = events.reduce(reducer.reduce, reducer.initial());
    expect(state.pendingInputRequests).toEqual([request]);
    expect(state.phase).toBe("idle");
    state = reducer.reduce(state, { type: "client.input.responded", data: {
      createdAt: 1, responses: [{ requestId: request.requestId, optionId: "approve" }],
    } });
    expect(state.pendingInputRequests).toEqual([request]);
    expect(state.phase).toBe("streaming");
    state = reducer.reduce(state, { type: "action.result", data: {
      sequence: 1, stepIndex: 0, turnId: "turn-1", status: "completed",
      result: { kind: "tool-result", callId: "call-1", toolName: "assign_plan", output: { ok: true } },
    } });
    expect(state.pendingInputRequests).toEqual([]);
  });

  it("adds an optimistic user message on client.message.submitted", () => {
    const next = reducer.reduce(reducer.initial(), {
      type: "client.message.submitted",
      data: {
        submissionId: "sub-1",
        message: "Build a bench plan",
        createdAt: Date.now(),
      },
    });

    expect(next.messages).toEqual([
      { role: "user", content: "Build a bench plan" },
    ]);
    expect(next.phase).toBe("streaming");
  });

  it("keeps the optimistic user message when Eve replays client.message.failed after abort", () => {
    const next = reducer.reduce(reducer.initial(), {
      type: "client.message.failed",
      data: {
        submissionId: "sub-1",
        message: "Build a bench plan",
        createdAt: Date.now(),
        error: { message: "fetch is aborted" },
      },
    });

    expect(next.messages).toEqual([
      { role: "user", content: "Build a bench plan" },
    ]);
    expect(next.phase).not.toBe("error");
    expect(next.errors).toEqual([]);
  });

  it("streams assistant text from message.appended messageSoFar", () => {
    let state = reducer.initial();
    state = reducer.reduce(state, {
      type: "message.appended",
      data: {
        turnId: "turn-1",
        stepIndex: 0,
        sequence: 1,
        messageDelta: "Hello",
        messageSoFar: "Hello",
      },
    });

    expect(state.streamingAssistantText).toBe("Hello");
  });

  it("finalizes assistant text on turn.completed", () => {
    let state = reducer.initial();
    state = {
      ...state,
      messages: [{ role: "user", content: "Hi" }],
      streamingAssistantText: "Here is a plan.",
    };

    state = reducer.reduce(state, {
      type: "turn.completed",
      data: {
        turnId: "turn-1",
        sequence: 2,
      },
    });

    expect(state.messages).toEqual([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Here is a plan." },
    ]);
    expect(state.streamingAssistantText).toBe("");
    expect(state.runStatus).toBe("done");
  });

  it("finalizes assistant text on session.waiting", () => {
    let state = reducer.initial();
    state = {
      ...state,
      messages: [{ role: "user", content: "Hi" }],
      streamingAssistantText: "Here is a plan.",
    };

    state = reducer.reduce(state, {
      type: "session.waiting",
      data: {
        turnId: "turn-1",
        sequence: 2,
      },
    });

    expect(state.messages).toEqual([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Here is a plan." },
    ]);
    expect(state.streamingAssistantText).toBe("");
    expect(state.runStatus).toBe("done");
  });

  it("surfaces session.failed in errors", () => {
    const next = reducer.reduce(reducer.initial(), {
      type: "session.failed",
      data: {
        code: "MODEL_ERROR",
        message: "AI Gateway authentication failed.",
        turnId: "turn-1",
        sequence: 1,
      },
    });

    expect(next.phase).toBe("error");
    expect(next.errors).toEqual([
      { message: "AI Gateway authentication failed." },
    ]);
  });

  it("does not surface submit_plan_code sandbox failures in chat errors", () => {
    let state = reducer.initial();
    state = reducer.reduce(state, {
      type: "actions.requested",
      data: {
        turnId: "turn-1",
        stepIndex: 0,
        sequence: 1,
        actions: [{ kind: "tool-call", toolName: "submit_plan_code" }],
      },
    });

    expect(state.runStatus).toBe("sandbox");

    state = reducer.reduce(state, {
      type: "action.result",
      data: {
        turnId: "turn-1",
        stepIndex: 0,
        sequence: 2,
        result: {
          kind: "tool-result",
          toolName: "submit_plan_code",
          output: {
            ok: false,
            errors: [
              {
                code: "SANDBOX_FAILED",
                message:
                  "Traceback (most recent call last):\n  File \"run.py\", line 3\nNameError: name 'foo' is not defined",
              },
            ],
          },
        },
      },
    });

    expect(state.errors).toEqual([]);
    expect(state.phase).not.toBe("error");
    expect(state.runStatus).toBe("sandbox");
  });

  it("clears errors when submit_plan_code succeeds", () => {
    let state = {
      ...reducer.initial(),
      errors: [{ message: "Stale error" }],
      phase: "streaming" as const,
    };

    state = reducer.reduce(state, {
      type: "action.result",
      data: {
        turnId: "turn-1",
        stepIndex: 1,
        sequence: 3,
        result: {
          kind: "tool-result",
          toolName: "submit_plan_code",
          output: {
            ok: true,
            plan: { name: "Bench Plan", version: "3.0.0", weeks: [] },
            title: "Bench Plan",
          },
        },
      },
    });

    expect(state.errors).toEqual([]);
    expect(state.currentArtifact).toEqual({
      name: "Bench Plan",
      version: "3.0.0",
      weeks: [],
    });
    expect(state.artifactTitle).toBe("Bench Plan");
  });
});
