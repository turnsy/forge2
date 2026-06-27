import { describe, expect, it } from "vitest";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";

describe("createEveCoachReducer", () => {
  const reducer = createEveCoachReducer();

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
});
