import { describe, expect, it } from "vitest";
import { z } from "zod";
import { confirmationProposalSchema, confirmedChoicesFromBody, resolveConfirmedChoice } from "./confirmed-actions";

const confirmationId = "00000000-0000-4000-8000-000000000001";
const proposal = { confirmationId, prompt: "Assign Strength to which Jay?", choices: [
  { id: "jay-1", label: "Jay", input: { athleteId: "athlete-1" } },
  { id: "jay-2", label: "Jay (Athlete)", input: { athleteId: "athlete-2" } },
] };
const grant = { confirmationId, toolName: "assign_plan", choiceId: "jay-2" };

describe("confirmed action selection", () => {
  it("resolves only the proposed input associated with the explicit choice", () => {
    const grants = confirmedChoicesFromBody({ inputResponses: [{ requestId: "request-1", optionId: "approve", text: JSON.stringify(grant) }] });
    expect(resolveConfirmedChoice(proposal, "assign_plan", JSON.stringify(grants)).input).toEqual({ athleteId: "athlete-2" });
  });
  it.each([
    undefined, "invalid-json", JSON.stringify([]),
    JSON.stringify([{ ...grant, confirmationId: "00000000-0000-4000-8000-000000000002" }]),
    JSON.stringify([{ ...grant, toolName: "accept_coach_link" }]),
    JSON.stringify([{ ...grant, choiceId: "unproposed-athlete" }]),
  ])("rejects missing, stale, or mismatched grants: %s", (grants) => {
    expect(() => resolveConfirmedChoice(proposal, "assign_plan", grants)).toThrow("exact action");
  });
  it("does not treat denial, ordinary text, or model context as authorization", () => {
    expect(confirmedChoicesFromBody({ inputResponses: [{ optionId: "deny", text: JSON.stringify(grant) }], clientContext: grant })).toEqual([]);
    expect(confirmedChoicesFromBody({ message: "yes", clientContext: grant })).toEqual([]);
  });
  it("validates candidate inputs and disallows ambiguous duplicate choice ids", () => {
    const schema = confirmationProposalSchema(z.object({ athleteId: z.string().min(1) }));
    expect(schema.safeParse(proposal).success).toBe(true);
    expect(schema.safeParse({ ...proposal, choices: [proposal.choices[0], proposal.choices[0]] }).success).toBe(false);
    expect(schema.safeParse({ ...proposal, choices: [{ ...proposal.choices[0], input: {} }] }).success).toBe(false);
  });
});
