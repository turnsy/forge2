import { describe, expect, it } from "vitest";
import {
  canSendInPhase,
  canStopInPhase,
  finalizeTurnData,
  resolveTurnView,
  type TurnViewInput,
} from "@/lib/chat/adapters/plan/turn-lifecycle";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import { STREAM_INTERRUPTED_MESSAGE } from "@/lib/chat/stream-completion";
import type { EveCoachReducerData } from "@/lib/chat/session-types";

const reducer = createEveCoachReducer();

function idleData(overrides: Partial<EveCoachReducerData> = {}): EveCoachReducerData {
  return { ...reducer.initial(), ...overrides };
}

function midTurnData(streamingText = ""): EveCoachReducerData {
  let data = reducer.initial();
  data = reducer.reduce(data, {
    type: "client.message.submitted",
    data: {
      createdAt: Date.now(),
      message: "Build a plan",
      submissionId: "sub-1",
    },
  });
  data = reducer.reduce(data, {
    type: "turn.started",
    data: { turnId: "turn-1", sequence: 1 },
  });

  if (streamingText) {
    data = reducer.reduce(data, {
      type: "message.appended",
      data: { messageSoFar: streamingText },
    });
  }

  return data;
}

function view(overrides: Partial<TurnViewInput>): ReturnType<typeof resolveTurnView> {
  return resolveTurnView({
    agentStatus: "ready",
    agentErrorMessage: null,
    stopPending: false,
    finalization: null,
    eventCount: 0,
    data: idleData(),
    ...overrides,
  });
}

describe("finalizeTurnData", () => {
  it("materializes partial assistant text as a settled message", () => {
    const finalized = finalizeTurnData(midTurnData("Partial reply"), "stopped");

    expect(finalized.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "assistant", content: "Partial reply" },
    ]);
    expect(finalized.streamingAssistantText).toBe("");
    expect(finalized.runStatus).toBe("done");
    expect(finalized.phase).toBe("idle");
    expect(finalized.errors).toEqual([]);
  });

  it("closes an open turn without text and clears transient errors", () => {
    const data = {
      ...midTurnData(),
      errors: [{ message: "fetch is aborted" }],
    };

    const finalized = finalizeTurnData(data, "stopped");

    expect(finalized.runStatus).toBeNull();
    expect(finalized.phase).toBe("idle");
    expect(finalized.errors).toEqual([]);
  });

  it("adds the interrupted message only for interrupted turns", () => {
    const interrupted = finalizeTurnData(midTurnData("Partial"), "interrupted");
    expect(interrupted.errors).toEqual([{ message: STREAM_INTERRUPTED_MESSAGE }]);

    const restored = finalizeTurnData(midTurnData("Partial"), "restored");
    expect(restored.errors).toEqual([]);
  });

  it("clears abort debris on an already-settled projection", () => {
    const data = idleData({
      phase: "error",
      runStatus: "error",
      errors: [{ message: "fetch is aborted" }],
    });

    const finalized = finalizeTurnData(data, "stopped");

    expect(finalized.phase).toBe("idle");
    expect(finalized.runStatus).toBeNull();
    expect(finalized.errors).toEqual([]);
  });

  it("leaves a settled projection alone for interrupted restores", () => {
    const data = idleData();
    expect(finalizeTurnData(data, "interrupted")).toBe(data);
  });
});

describe("resolveTurnView", () => {
  it("is idle for a settled projection", () => {
    const result = view({});
    expect(result.uiPhase).toBe("idle");
  });

  it("is sending after submit before any text streams", () => {
    const result = view({
      agentStatus: "submitted",
      data: midTurnData(),
      eventCount: 2,
    });
    expect(result.uiPhase).toBe("sending");
  });

  it("is streaming while text arrives", () => {
    const result = view({
      agentStatus: "streaming",
      data: midTurnData("Partial"),
      eventCount: 3,
    });
    expect(result.uiPhase).toBe("streaming");
  });

  it("is streaming when the stream ended but the server turn is still open", () => {
    const result = view({
      agentStatus: "ready",
      data: midTurnData("Partial"),
      eventCount: 3,
    });
    expect(result.uiPhase).toBe("streaming");
  });

  it("shows stopping with finalized data while the store winds down", () => {
    const result = view({
      agentStatus: "streaming",
      stopPending: true,
      data: midTurnData("Partial"),
      eventCount: 3,
    });

    expect(result.uiPhase).toBe("stopping");
    expect(result.data.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "assistant", content: "Partial" },
    ]);
    expect(result.data.streamingAssistantText).toBe("");
  });

  it("settles to idle once a stop finalization is recorded", () => {
    const result = view({
      agentStatus: "ready",
      finalization: { reason: "stopped", eventCount: 3 },
      eventCount: 3,
      data: midTurnData("Partial"),
    });

    expect(result.uiPhase).toBe("idle");
    expect(result.data.runStatus).toBe("done");
    expect(result.data.errors).toEqual([]);
  });

  it("swallows errors that surface under a stop finalization", () => {
    const result = view({
      agentStatus: "ready",
      agentErrorMessage: "fetch is aborted",
      finalization: { reason: "stopped", eventCount: 3 },
      eventCount: 3,
      data: {
        ...midTurnData(),
        phase: "error",
        runStatus: "error",
        errors: [{ message: "fetch is aborted" }],
      },
    });

    expect(result.uiPhase).toBe("idle");
    expect(result.data.errors).toEqual([]);
  });

  it("ignores a finalization once the event log advances past it", () => {
    const data = midTurnData("New turn text");
    const result = view({
      agentStatus: "streaming",
      finalization: { reason: "stopped", eventCount: 3 },
      eventCount: 5,
      data,
    });

    expect(result.uiPhase).toBe("streaming");
    expect(result.data).toBe(data);
  });

  it("shows the interrupted message when finalized as interrupted", () => {
    const result = view({
      agentStatus: "ready",
      finalization: { reason: "interrupted", eventCount: 2 },
      eventCount: 2,
      data: midTurnData(),
    });

    expect(result.uiPhase).toBe("idle");
    expect(result.data.errors).toEqual([{ message: STREAM_INTERRUPTED_MESSAGE }]);
  });

  it("restores a marker-annotated turn silently", () => {
    const result = view({
      agentStatus: "ready",
      finalization: { reason: "restored", eventCount: 2 },
      eventCount: 2,
      data: midTurnData("Partial from before"),
    });

    expect(result.uiPhase).toBe("idle");
    expect(result.data.errors).toEqual([]);
    expect(result.data.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "assistant", content: "Partial from before" },
    ]);
  });

  it("surfaces agent errors when no stop is involved", () => {
    const result = view({
      agentStatus: "error",
      agentErrorMessage: "Something broke",
      data: idleData(),
    });

    expect(result.uiPhase).toBe("error");
    expect(result.data.errors).toEqual([{ message: "Something broke" }]);
  });

  it("does not duplicate the agent error when the projection already has it", () => {
    const result = view({
      agentStatus: "error",
      agentErrorMessage: "Something broke",
      data: idleData({
        phase: "error",
        errors: [{ message: "Something broke" }],
      }),
    });

    expect(result.data.errors).toEqual([{ message: "Something broke" }]);
  });
});

describe("phase gating", () => {
  it("allows sending only when idle or errored", () => {
    expect(canSendInPhase("idle")).toBe(true);
    expect(canSendInPhase("error")).toBe(true);
    expect(canSendInPhase("sending")).toBe(false);
    expect(canSendInPhase("streaming")).toBe(false);
    expect(canSendInPhase("stopping")).toBe(false);
  });

  it("allows stopping only while a turn is in flight", () => {
    expect(canStopInPhase("sending")).toBe(true);
    expect(canStopInPhase("streaming")).toBe(true);
    expect(canStopInPhase("idle")).toBe(false);
    expect(canStopInPhase("stopping")).toBe(false);
    expect(canStopInPhase("error")).toBe(false);
  });
});
