import { describe, expect, it } from "vitest";
import type { InputRequest } from "eve/client";
import { chatInputResponse, isChatInputResponse, isCancelledResponse, isValidInputResponse, parseSelectionAnswer, selectedResponseIds, selectionResponse } from "./input-selection";

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
  it.each([[], ["mon"], ["mon", "wed"]].map((ids) => ({ ids })))("accepts a typed reply with draft choices $ids without confirming them", ({ ids }) => {
    const response = chatInputResponse(request, "Also Friday", selectionResponse(request, ids));
    expect(isChatInputResponse(response)).toBe(true);
    expect(isCancelledResponse(response)).toBe(false);
    expect(response.optionId).toBeUndefined();
    expect(parseSelectionAnswer(response.text)).toEqual({ status: "replied", message: "Also Friday", selections: ids.map((id) => ({ id, label: id === "mon" ? "Monday" : "Wednesday" })) });
    expect(isValidInputResponse(request, response)).toBe(true);
  });
  it("does not interpret approval language or rewritten targets in the client", () => {
    for (const message of ["Yes, go ahead", "Yes, but use Jane instead", "Looks good", "Something else entirely"]) {
      const response = chatInputResponse(request, message);
      expect(parseSelectionAnswer(response.text)).toMatchObject({ status: "replied", message, selections: [] });
      expect(response.optionId).toBeUndefined();
      expect(isValidInputResponse(request, response)).toBe(true);
    }
  });
  it("preserves an open text field separately from the written instruction", () => {
    const response = chatInputResponse({ ...request, display: "text", options: [] }, "Use this as a starting point", { requestId: request.requestId, text: "Draft answer" });
    expect(parseSelectionAnswer(response.text)).toMatchObject({ message: "Use this as a starting point", draftText: "Draft answer" });
  });
  it("rejects blank typed replies and invalid draft choices", () => {
    expect(isValidInputResponse(request, chatInputResponse(request, "   "))).toBe(false);
    const response = chatInputResponse(request, "Friday instead");
    expect(isValidInputResponse(request, { ...response, text: JSON.stringify({ status: "replied", message: "Friday instead", selections: [{ id: "fake", label: "Friday" }] }) })).toBe(false);
  });
  it("resolves native approval revisions without executing the old proposed arguments", () => {
    const response = chatInputResponse({ ...request, display: "confirmation" }, "Use Jane instead");
    expect(response.optionId).toBe("deny");
    expect(isChatInputResponse(response)).toBe(true);
    expect(isCancelledResponse(response)).toBe(false);
  });
  it("handles old plain question answers and malformed JSON safely", () => {
    expect(selectedResponseIds({ requestId: request.requestId, optionId: "mon" })).toEqual(["mon"]);
    expect(parseSelectionAnswer("{bad")).toBeNull();
    expect(isValidInputResponse(request, { requestId: request.requestId, optionId: "mon" })).toBe(true);
  });
});
