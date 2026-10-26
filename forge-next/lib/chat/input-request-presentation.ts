import type { InputRequest } from "eve/client";

export const CANCEL_INPUT_REQUEST_TEXT = "Cancel this request. Do not carry out the proposed action.";

export function inputRequestPresentation(request: InputRequest) {
  if (request.display !== "confirmation") {
    return { prompt: request.prompt, confirmLabel: "Confirm selection" };
  }
  const actions: Record<string, { prompt: string; confirmLabel: string }> = {
    assign_plan: { prompt: "Assign this plan to the selected athletes? This replaces their current assignment.", confirmLabel: "Assign plan" },
    accept_coach_link: { prompt: "Accept this athlete's request to connect with you?", confirmLabel: "Accept request" },
    reject_coach_link: { prompt: "Decline this athlete's request to connect with you?", confirmLabel: "Decline request" },
  };
  const action = actions[request.action.toolName] ?? { prompt: "Confirm the proposed action?", confirmLabel: "Confirm action" };
  return { ...action, prompt: request.prompt.startsWith("Approve tool call:") ? action.prompt : request.prompt };
}
