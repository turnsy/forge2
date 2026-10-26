import { z } from "zod";
import type { InputRequest } from "eve/client";

export const confirmedChoiceSchema = z.object({
  confirmationId: z.string().uuid(),
  toolName: z.string().min(1),
  choiceId: z.string().min(1),
}).strict();

export function confirmationProposalSchema<T extends z.ZodType>(input: T) {
  return z.object({
    confirmationId: z.string().uuid().describe("A new unique UUID for this proposed action."),
    prompt: z.string().min(1).describe("Plain-language question naming the exact action and plan. Explain replacement effects."),
    choices: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1).describe("The athlete or action name shown to the coach."),
      description: z.string().optional().describe("Known distinguishing details, such as their current plan."),
      input,
    })).min(1).max(20),
  }).refine((value) => new Set(value.choices.map((choice) => choice.id)).size === value.choices.length, "Choice ids must be unique");
}

const displayProposalSchema = confirmationProposalSchema(z.unknown());
export function getConfirmationProposal(request: InputRequest) {
  if (request.display !== "confirmation") return null;
  const parsed = displayProposalSchema.safeParse(request.action?.input);
  return parsed.success ? parsed.data : null;
}

export function parseConfirmedChoice(text: string | undefined) {
  if (!text) return null;
  try {
    const parsed = confirmedChoiceSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

// Only called on the authenticated HTTP request. Model-authored context is
// never a source of grants, and the native Eve approval gate remains required.
export function confirmedChoicesFromBody(body: unknown) {
  const parsed = z.object({ inputResponses: z.array(z.object({ optionId: z.string().optional(), text: z.string().optional() })).optional() }).safeParse(body);
  return (parsed.success ? parsed.data.inputResponses ?? [] : [])
    .filter((response) => response.optionId === "approve")
    .flatMap((response) => {
      const choice = parseConfirmedChoice(response.text);
      return choice ? [choice] : [];
    });
}

export function resolveConfirmedChoice<T>(proposal: { confirmationId: string; choices: { id: string; input: T }[] }, toolName: string, serializedGrants: unknown): { id: string; input: T } {
  let grants: z.infer<typeof confirmedChoiceSchema>[] = [];
  try {
    const parsed = z.array(confirmedChoiceSchema).safeParse(typeof serializedGrants === "string" ? JSON.parse(serializedGrants) : null);
    if (parsed.success) grants = parsed.data;
  } catch { /* Missing or malformed grants must fail closed. */ }
  const grant = grants.find((grant) => grant.confirmationId === proposal.confirmationId && grant.toolName === toolName);
  const choice = proposal.choices.find((choice) => choice.id === grant?.choiceId);
  if (!choice) throw new Error("A confirmed selection for this exact action is required.");
  return choice;
}
