import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ToolContext } from "eve/tools";
import { defineConfirmedForgeTool } from "./define-confirmed-forge-tool";
import { ToolLoopAgent, isStepCount, tool } from "ai";
import { MockLanguageModelV4, convertArrayToReadableStream } from "ai/test";
import { confirmationProposalSchema, confirmedChoicesFromBody } from "@/lib/chat/confirmed-actions";

const state = vi.hoisted(() => ({ consumed: [] as string[] }));
vi.mock("eve/context", () => ({ defineState: () => ({
  get: () => state.consumed,
  update: (update: (value: string[]) => string[]) => { state.consumed = update(state.consumed); },
}) }));
vi.mock("./with-forge-db", () => ({ withForgeDbContextAsync: (_ctx: unknown, fn: () => unknown) => fn() }));

const confirmationId = "00000000-0000-4000-8000-000000000001";
const proposal = { confirmationId, prompt: "Assign Strength to whom?", choices: [
  { id: "jay-1", label: "Jay", input: { athleteId: "athlete-1" } },
  { id: "jay-2", label: "Jay (Athlete)", input: { athleteId: "athlete-2" } },
] };
function context(grants: unknown[] = []): ToolContext {
  return { session: { auth: { current: { principalId: "coach-1", attributes: { forgeConfirmedActions: JSON.stringify(grants) } } } } } as unknown as ToolContext;
}
describe("single-card confirmed tools", () => {
  beforeEach(() => { state.consumed = []; });

  it("resumes native approval through the real AI SDK without another approval request", async () => {
    const inputSchema = z.object({ athleteId: z.string() });
    const execute = vi.fn(async (input: { athleteId: string }) => ({ ok: true, athleteId: input.athleteId }));
    const definition = defineConfirmedForgeTool({ toolName: "assign_plan", description: "Assign a plan", inputSchema, execute });
    const grants = confirmedChoicesFromBody({ inputResponses: [{ requestId: "approval-1", optionId: "approve", text: JSON.stringify({ confirmationId, toolName: "assign_plan", choiceId: "jay-2" }) }] });
    const ctx = context(grants);
    const model = new MockLanguageModelV4({ doStream: async ({ prompt }) => {
      expect(execute).toHaveBeenCalledExactlyOnceWith({ athleteId: "athlete-2" }, ctx);
      expect(prompt.some((message) => message.role === "tool" && message.content.some((part) => part.type === "tool-result" && part.toolCallId === "call-1"))).toBe(true);
      return { stream: convertArrayToReadableStream([
        { type: "text-start", id: "reply" }, { type: "text-delta", id: "reply", delta: "Assigned." }, { type: "text-end", id: "reply" },
        { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage: { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } } },
      ]) };
    } });
    const agent = new ToolLoopAgent({ model, stopWhen: isStepCount(1), maxRetries: 0,
      toolApproval: () => "user-approval",
      tools: { assign_plan: tool({ inputSchema: confirmationProposalSchema(inputSchema), execute: (input) => definition.execute(input, ctx) }) },
    });
    const result = await agent.stream({ messages: [
      { role: "assistant", content: [{ type: "tool-call", toolCallId: "call-1", toolName: "assign_plan", input: proposal }, { type: "tool-approval-request", approvalId: "approval-1", toolCallId: "call-1" }] },
      { role: "tool", content: [{ type: "tool-approval-response", approvalId: "approval-1", approved: true }] },
    ] });
    for await (const event of result.fullStream) {
      if (event.type === "error") throw event.error;
      expect(event.type).not.toBe("tool-approval-request");
    }
    expect(await result.text).toBe("Assigned.");
    expect(execute).toHaveBeenCalledOnce();
  });

  it("keeps native approval, executes only the chosen input once, and emits a replayable receipt", async () => {
    const execute = vi.fn(async (input: { athleteId: string }) => ({ ok: true, athleteId: input.athleteId }));
    const tool = defineConfirmedForgeTool({ toolName: "assign_plan", description: "Assign a plan", inputSchema: z.object({ athleteId: z.string() }), execute });
    const ctx = context([{ confirmationId, toolName: "assign_plan", choiceId: "jay-2" }]);
    expect(await tool.approval?.({ ...ctx, approvedTools: new Set(), toolName: "assign_plan", toolInput: proposal })).toBe("user-approval");
    const result = await tool.execute(proposal, ctx);
    expect(execute).toHaveBeenCalledExactlyOnceWith({ athleteId: "athlete-2" }, ctx);
    expect(result.confirmation).toEqual({ confirmationId, choiceId: "jay-2" });
    await expect(tool.execute(proposal, ctx)).rejects.toThrow("already been used");
    expect(execute).toHaveBeenCalledOnce();
  });

  it("does not execute from a bare approval without a confirmed choice", async () => {
    const execute = vi.fn(async () => ({ ok: true }));
    const tool = defineConfirmedForgeTool({ toolName: "assign_plan", description: "Assign a plan", inputSchema: z.object({ athleteId: z.string() }), execute });
    await expect(tool.execute(proposal, context())).rejects.toThrow("exact action");
    expect(execute).not.toHaveBeenCalled();
  });
});
