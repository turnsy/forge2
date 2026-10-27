import { describe, expect, it, vi } from "vitest";
import { ToolLoopAgent, isStepCount, tool, type ModelMessage } from "ai";
import { MockLanguageModelV4, convertArrayToReadableStream } from "ai/test";
import { z } from "zod";
import { prepareForgeClientSend } from "./forge-client-context";

describe("approval resume model history", () => {
  it.each([true, false])("executes the approved tool before calling the model (append context=%s)", async (appendContext) => {
    const execute = vi.fn(async () => ({ ok: true }));
    const model = new MockLanguageModelV4({
      doStream: async ({ prompt }) => {
        const hasOutput = prompt.some((message) => message.role === "tool" && message.content.some(
          (part) => part.type === "tool-result" && part.toolCallId === "call-assignment",
        ));
        if (!hasOutput) throw new Error("No tool output found for function call call-assignment.");
        expect(execute).toHaveBeenCalledOnce();
        return {
          stream: convertArrayToReadableStream([
            { type: "text-start", id: "reply" },
            { type: "text-delta", id: "reply", delta: "Assigned." },
            { type: "text-end", id: "reply" },
            { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage: {
              inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 1, text: 1, reasoning: undefined },
            } },
          ]),
        };
      },
    });
    const agent = new ToolLoopAgent({ model, stopWhen: isStepCount(1), maxRetries: 0,
      toolApproval: () => "approved",
      tools: { assign_plan: tool({ inputSchema: z.object({}), execute }) },
    });
    const payload = prepareForgeClientSend({ inputResponses: [{ requestId: "approval-1", optionId: "approve" }] }, { forgeSessionId: "forge-1" });
    const messages: ModelMessage[] = [
      { role: "assistant", content: [
        { type: "tool-call", toolCallId: "call-assignment", toolName: "assign_plan", input: {} },
        { type: "tool-approval-request", approvalId: "approval-1", toolCallId: "call-assignment" },
      ] },
      { role: "tool", content: [{ type: "tool-approval-response", approvalId: "approval-1", approved: true }] },
    ];
    // Reproduce Eve's clientContext -> trailing user-message conversion.
    const context = appendContext ? { forge: "forge" } : payload.clientContext;
    if (context !== undefined) messages.push({ role: "user", content: `Client context:\n${JSON.stringify(context)}` });
    const run = async () => {
      const response = await agent.stream({ messages });
      for await (const part of response.fullStream) {
        if (part.type === "error") throw part.error;
      }
      return response.text;
    };
    if (appendContext) {
      await expect(run()).rejects.toThrow("No tool output found");
      expect(execute).not.toHaveBeenCalled();
    } else {
      await expect(run()).resolves.toBe("Assigned.");
      expect(execute).toHaveBeenCalledOnce();
    }
  });
});
