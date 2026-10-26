import { describe, expect, it } from "vitest";
import type { HandleMessageStreamEvent, InputRequest } from "eve/client";
import { createEveCoachReducer } from "./eve-coach-reducer";
import { buildPersistedCoachSnapshot } from "./coach-eve-persist";
import { selectionResponse } from "@/lib/chat/input-selection";

const request: InputRequest = {
  requestId: "question-1", display: "select", prompt: "Assign Strength to whom?",
  options: [{ id: "jay-1", label: "Jay" }, { id: "jay-2", label: "Jay (Athlete)" }],
  action: { kind: "tool-call", callId: "call-1", toolName: "ask_question", input: { selectionMode: "multiple" } },
};
const prefix: HandleMessageStreamEvent[] = [
  { type: "message.received", data: { message: "Assign Jay", sequence: 1, turnId: "turn-1" } },
  { type: "input.requested", data: { requests: [request], sequence: 1, stepIndex: 0, turnId: "turn-1" } },
  { type: "session.waiting", data: { wait: "next-user-message" } },
];
const suffix: HandleMessageStreamEvent[] = [
  { type: "turn.started", data: { sequence: 2, turnId: "turn-2" } },
  { type: "message.completed", data: { message: "Assigned Strength.", finishReason: "stop", sequence: 2, stepIndex: 0, turnId: "turn-2" } },
  { type: "turn.completed", data: { sequence: 2, turnId: "turn-2" } },
];

describe("input card history", () => {
  it.each([false, true])("retains every acknowledged choice and cancellation=%s through reload", (cancelled) => {
    const response = selectionResponse(request, ["jay-1", "jay-2"], cancelled);
    const snapshot = buildPersistedCoachSnapshot({ forgeSessionId: "forge-1", title: "Assignment", session: { sessionId: "eve-1", continuationToken: "token", streamIndex: prefix.length }, events: prefix, inputCardResponses: [response] });
    const reducer = createEveCoachReducer({ inputCardResponses: snapshot.inputCardResponses });
    const replayed = snapshot.eveEvents!.reduce(reducer.reduce, reducer.initial());
    expect(replayed.messages[1].inputCard).toMatchObject({ status: cancelled ? "cancelled" : "submitted", selectedChoiceIds: ["jay-1", "jay-2"] });
    const resumed = suffix.reduce(reducer.reduce, replayed);
    expect(resumed.messages[1].inputCard).toMatchObject({ status: cancelled ? "cancelled" : "completed", selectedChoiceIds: ["jay-1", "jay-2"] });
    expect(resumed.pendingInputRequests).toEqual([]);
  });

  it("keeps the submitted card in its original position on live resume and replay", () => {
    const response = selectionResponse(request, ["jay-1", "jay-2"]);
    const reducer = createEveCoachReducer();
    let state = prefix.reduce(reducer.reduce, reducer.initial());
    expect(state.messages[1].inputCard?.selectedChoiceIds).toBeUndefined();
    state = reducer.reduce(state, { type: "client.input.responded", data: { responses: [response], createdAt: 1 } });
    state = suffix.reduce(reducer.reduce, state);
    const replayReducer = createEveCoachReducer({ inputCardResponses: [response] });
    const replayed = [...prefix, ...suffix].reduce(replayReducer.reduce, replayReducer.initial());
    expect(replayed.messages).toEqual(state.messages);
    expect(replayed.messages.map((message) => message.inputCard ? "CARD" : message.content)).toEqual(["Assign Jay", "CARD", "Assigned Strength."]);
    expect(replayed.messages[1].inputCard).toMatchObject({ status: "completed", selectedChoiceIds: ["jay-1", "jay-2"] });
  });

  it("retains selected rows if the session fails before resuming", () => {
    const reducer = createEveCoachReducer({ inputCardResponses: [selectionResponse(request, ["jay-2"])] });
    let state = prefix.reduce(reducer.reduce, reducer.initial());
    state = reducer.reduce(state, { type: "session.failed", data: { code: "MODEL_CALL_FAILED", sessionId: "eve-1", message: "Gateway rejected" } });
    expect(state.messages[1].inputCard).toMatchObject({ status: "failed", selectedChoiceIds: ["jay-2"] });
  });
});
