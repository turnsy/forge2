import { describe, expect, it } from "vitest";
import type { InputRequest } from "eve/client";
import { isCancelledResponse, isValidInputResponse, parseSelectionAnswer, selectedResponseIds, selectionResponse } from "./input-selection";

const request: InputRequest = {
  requestId: "question", display: "select", prompt: "Which training days?", allowFreeform: false,
  options: [{ id: "mon", label: "Monday" }, { id: "wed", label: "Wednesday" }],
  action: { kind: "tool-call", callId: "question", toolName: "ask_question", input: { selectionMode: "multiple" } },
};

describe("question selections", () => {
  it("returns stable IDs and labels together as one steering response", () => {
    const response = selectionResponse(request, ["wed", "mon"]);
    expect(response.optionId).toBeUndefined();
    expect(parseSelectionAnswer(response.text)).toEqual({ status: "confirmed", selections: [{ id: "mon", label: "Monday" }, { id: "wed", label: "Wednesday" }] });
    expect(selectedResponseIds(response)).toEqual(["mon", "wed"]);
    expect(isValidInputResponse(request, response)).toBe(true);
  });
  it("supports single choice questions without changing the Eve response envelope", () => {
    const single = { ...request, action: { ...request.action, input: {} } };
    const response = selectionResponse(single, ["mon"]);
    expect(response.optionId).toBe("mon");
    expect(isValidInputResponse(single, response)).toBe(true);
    expect(isValidInputResponse(single, selectionResponse(request, ["mon", "wed"]))).toBe(false);
  });
  it.each([{ ids: [] }, { ids: ["mon", "wed"] }])("represents cancellation explicitly and preserves choices $ids", ({ ids }) => {
    const response = selectionResponse(request, ids, true);
    expect(isCancelledResponse(response)).toBe(true);
    expect(isValidInputResponse(request, response)).toBe(true);
    expect(selectedResponseIds(response)).toEqual(ids);
  });
  it("rejects empty confirmation, repeated IDs, unknown IDs, incorrect labels, and mismatched requests", () => {
    const good = selectionResponse(request, ["mon"]);
    const answer = parseSelectionAnswer(good.text)!;
    for (const selections of [[], [answer.selections[0], answer.selections[0]], [{ id: "fri", label: "Friday" }], [{ id: "mon", label: "Wrong" }]]) {
      expect(isValidInputResponse(request, { ...good, text: JSON.stringify({ status: "confirmed", selections }) })).toBe(false);
    }
    expect(isValidInputResponse(request, { ...good, requestId: "different" })).toBe(false);
    expect(isValidInputResponse(request, { ...good, optionId: "wed" })).toBe(false);
    expect(isValidInputResponse(request, { requestId: request.requestId, text: "arbitrary custom answer" })).toBe(false);
  });
  it("handles old plain question answers and malformed JSON safely", () => {
    expect(selectedResponseIds({ requestId: request.requestId, optionId: "mon" })).toEqual(["mon"]);
    expect(parseSelectionAnswer("{bad")).toBeNull();
    expect(isValidInputResponse(request, { requestId: request.requestId, optionId: "mon" })).toBe(true);
  });
});
