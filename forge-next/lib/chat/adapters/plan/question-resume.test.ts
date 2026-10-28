import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import Ajv from "ajv";
import { chatInputResponse, parseSelectionAnswer, selectionResponse } from "@/lib/chat/input-selection";

// Exercise the installed Eve implementation, including our small schema extension.
async function eveModule(path: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve("node_modules/eve/dist/src", path)).href);
}

describe("native Eve question continuation", () => {
  it("resolves several questions with one message and preserves their draft context for the model", async () => {
    const { extractQuestionInputRequests } = await eveModule("harness/input-extraction.js");
    const { setPendingInputBatch, resolvePendingInput, getApprovedTools } = await eveModule("harness/input-requests.js");
    const requests = extractQuestionInputRequests({ toolCalls: ["days", "athletes"].map((id) => ({ toolName: "ask_question", toolCallId: id, input: {
      prompt: `Which ${id}?`, allowFreeform: false, selectionMode: "multiple", options: [{ id: "a", label: "First" }, { id: "b", label: "Second" }],
    } })), excludedCallIds: new Set() });
    const message = "Also the second, but change the plan first";
    const responses = requests.map((request: Parameters<typeof chatInputResponse>[0]) => chatInputResponse(request, message, selectionResponse(request, ["a"])));
    const session = setPendingInputBatch({ session: { history: [] }, requests, responseMessages: [] });
    const resumed = resolvePendingInput({ session, stepInput: { message, inputResponses: responses } });
    expect(resumed.outcome).toBe("resolved");
    expect(resumed.consumedMessage).not.toBe(true);
    expect(resumed.deferredMessage).not.toBe(true);
    expect([...getApprovedTools(resumed.session)]).toEqual([]);
    expect(resumed.messages[0].content).toHaveLength(2);
    for (const part of resumed.messages[0].content) {
      expect(part.type).toBe("tool-result");
      expect(part.output.value.status).toBe("answered");
      expect(parseSelectionAnswer(part.output.value.text)).toEqual({ status: "replied", message, selections: [{ id: "a", label: "First" }] });
    }
  });

  it.each([false, true])("passes all selected IDs and labels to the model, cancellation=%s", async (cancelled) => {
    const { ASK_QUESTION_INPUT_SCHEMA } = await eveModule("runtime/framework-tools/ask-question.js");
    const { extractQuestionInputRequests } = await eveModule("harness/input-extraction.js");
    const { setPendingInputBatch, resolvePendingInput, getApprovedTools } = await eveModule("harness/input-requests.js");
    const input = {
      prompt: "Assign Strength to which athletes?", selectionMode: "multiple", allowFreeform: false,
      options: [{ id: "athlete-1", label: "Jay" }, { id: "athlete-2", label: "Jane" }],
    };
    const validate = new Ajv().compile(ASK_QUESTION_INPUT_SCHEMA);
    expect(validate(input), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...input, selectionMode: "invalid" })).toBe(false);
    const [request] = extractQuestionInputRequests({
      toolCalls: [{ toolName: "ask_question", toolCallId: "question-1", input }], excludedCallIds: new Set(),
    });
    expect(request.action.input.selectionMode).toBe("multiple");
    expect(request.display).toBe("select");
    const response = selectionResponse(request, ["athlete-1", "athlete-2"], cancelled);
    const session = setPendingInputBatch({ session: { history: [] }, requests: [request], responseMessages: [] });
    const resumed = resolvePendingInput({ session, stepInput: { inputResponses: [response] } });
    expect(resumed.outcome).toBe("resolved");
    expect(resumed.rejectedActions).toBeUndefined();
    expect([...getApprovedTools(resumed.session)]).toEqual([]);
    const parts = resumed.messages[0].content;
    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("tool-result");
    expect(parts[0].toolName).toBe("ask_question");
    expect(parts[0].output.value.status).toBe("answered");
    expect(parseSelectionAnswer(parts[0].output.value.text)).toEqual({
      status: cancelled ? "cancelled" : "confirmed",
      selections: [{ id: "athlete-1", label: "Jay" }, { id: "athlete-2", label: "Jane" }],
    });
    expect(parts.some((part: { type: string }) => part.type === "tool-approval-response")).toBe(false);
  });
});
