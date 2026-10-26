import { describe, expect, it } from "vitest";
import type { HandleMessageStreamEvent, InputRequest, InputResponse } from "eve/client";
import { createEveCoachReducer } from "./eve-coach-reducer";
import { buildPersistedCoachSnapshot } from "./coach-eve-persist";

const confirmationId = "00000000-0000-4000-8000-000000000001";
const request: InputRequest = { requestId: "approval-1", display: "confirmation", prompt: "Approve tool call: assign_plan",
  options: [{ id: "approve", label: "Yes" }, { id: "deny", label: "No" }],
  action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {
    confirmationId, prompt: "Assign Strength to whom?", choices: [
      { id: "jay-1", label: "Jay", input: { athleteId: "athlete-1" } },
      { id: "jay-2", label: "Jay (Athlete)", input: { athleteId: "athlete-2" } },
    ],
  } },
};
const response: InputResponse = { requestId: request.requestId, optionId: "approve", text: JSON.stringify({ confirmationId, toolName: "assign_plan", choiceId: "jay-2" }) };
const prefix: HandleMessageStreamEvent[] = [
  { type: "message.received", data: { message: "Assign Jay", sequence: 1, turnId: "turn-1" } },
  { type: "input.requested", data: { requests: [request], sequence: 1, stepIndex: 0, turnId: "turn-1" } },
  { type: "session.waiting", data: { wait: "next-user-message" } },
];

describe("input card history", () => {
  it("restores an acknowledged confirmation as disabled while the tool is still working", () => {
    const snapshot = buildPersistedCoachSnapshot({ forgeSessionId: "forge-1", title: "Assignment", session: { sessionId: "eve-1", continuationToken: "token", streamIndex: prefix.length }, events: prefix, inputCardResponses: [response] });
    const reducer = createEveCoachReducer({ inputCardResponses: snapshot.inputCardResponses });
    const replayed = snapshot.eveEvents!.reduce(reducer.reduce, reducer.initial());
    expect(replayed.messages[1].inputCard).toMatchObject({ status: "submitted", selectedChoiceId: "jay-2" });
  });
  it("keeps the same card between the original message and subsequent assistant output on live resume and replay", () => {
    const reducer = createEveCoachReducer();
    let state = prefix.reduce(reducer.reduce, reducer.initial());
    state = reducer.reduce(state, { type: "client.input.responded", data: { responses: [response], createdAt: 1 } });
    expect(state.messages[1].inputCard).toMatchObject({ status: "submitted", selectedChoiceId: "jay-2" });
    const suffix: HandleMessageStreamEvent[] = [
      { type: "turn.started", data: { sequence: 2, turnId: "turn-2" } },
      { type: "action.result", data: { sequence: 2, stepIndex: 0, turnId: "turn-2", status: "completed", result: {
        kind: "tool-result", callId: "call-1", toolName: "assign_plan", output: { ok: true, confirmation: { confirmationId, choiceId: "jay-2" } },
      } } },
      { type: "message.completed", data: { message: "Assigned Strength to Jay.", finishReason: "stop", sequence: 2, stepIndex: 0, turnId: "turn-2" } },
      { type: "turn.completed", data: { sequence: 2, turnId: "turn-2" } },
    ];
    state = suffix.reduce(reducer.reduce, state);
    const replayed = [...prefix, ...suffix].reduce(reducer.reduce, reducer.initial());
    expect(replayed.messages).toEqual(state.messages);
    expect(replayed.messages.map((message) => message.inputCard ? "CARD" : message.content)).toEqual(["Assign Jay", "CARD", "Assigned Strength to Jay."]);
    expect(replayed.messages[1].inputCard).toMatchObject({ status: "completed", selectedChoiceId: "jay-2" });
    expect(replayed.pendingInputRequests).toEqual([]);
  });

  it.each(["cancelled", "failed"] as const)("retains the selected row after reload when the action is %s", (status) => {
    const events: HandleMessageStreamEvent[] = [...prefix, status === "failed"
      ? { type: "session.failed", data: { code: "MODEL_CALL_FAILED", sessionId: "eve-1", message: "Gateway rejected" } }
      : { type: "action.result", data: { sequence: 2, stepIndex: 0, turnId: "turn-2", status: "rejected", result: { kind: "tool-result", callId: "call-1", toolName: "assign_plan", output: { code: "TOOL_EXECUTION_DENIED" } } } },
    ];
    const snapshot = buildPersistedCoachSnapshot({ forgeSessionId: "forge-1", title: "Assignment", session: { sessionId: "eve-1", continuationToken: "token", streamIndex: events.length }, events, inputCardResponses: [response] });
    const reducer = createEveCoachReducer({ inputCardResponses: snapshot.inputCardResponses });
    const replayed = snapshot.eveEvents!.reduce(reducer.reduce, reducer.initial());
    expect(replayed.messages[1].inputCard).toMatchObject({ status, selectedChoiceId: "jay-2" });
  });
});
