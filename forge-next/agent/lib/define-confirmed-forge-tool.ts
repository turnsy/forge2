import { z } from "zod";
import type { ToolContext } from "eve/tools";
import { always } from "eve/tools/approval";
import { defineState } from "eve/context";
import { defineForgeTool } from "./define-forge-tool";
import { confirmationProposalSchema, resolveConfirmedChoice } from "@/lib/chat/confirmed-actions";

const consumedConfirmations = defineState<string[]>("forge.consumed-confirmations", () => []);

export function defineConfirmedForgeTool<TSchema extends z.ZodObject, TOutput extends { ok: boolean }>(definition: {
  toolName: string;
  description: string;
  inputSchema: TSchema;
  execute: (input: z.output<TSchema>, ctx: ToolContext) => Promise<TOutput>;
}) {
  const schema = confirmationProposalSchema(definition.inputSchema);
  return defineForgeTool<z.output<typeof schema>, TOutput & { confirmation: { confirmationId: string; choiceId: string } }>({
    description: `${definition.description} Propose all matching candidates in choices; the coach selects one and confirms in a single card. Do not ask a separate question or perform the action before confirmation. Each choice must contain the complete validated input for that candidate.`,
    inputSchema: schema,
    approval: always(),
    async execute(proposal, ctx) {
      const choice = resolveConfirmedChoice({ ...proposal, choices: proposal.choices.map((choice) => ({ id: choice.id, input: definition.inputSchema.parse((choice as { input?: unknown }).input) })) }, definition.toolName, ctx.session.auth.current?.attributes.forgeConfirmedActions);
      const key = `${definition.toolName}:${proposal.confirmationId}`;
      if (consumedConfirmations.get().includes(key)) throw new Error("This confirmation has already been used. Propose a new action to retry.");
      consumedConfirmations.update((current) => [...current, key]);
      const result = await definition.execute(choice.input, ctx);
      return { ...result, confirmation: { confirmationId: proposal.confirmationId, choiceId: choice.id } };
    },
  });
}
