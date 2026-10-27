import { z } from "zod";
import type { InputRequest, InputResponse } from "eve/client";
import { trainingMaxFields, type TrainingMaxAnswer } from "./training-max-inputs";

export const CANCEL_INPUT_REQUEST_TEXT =
  "Cancel this request. Do not carry out the proposed action.";

const selectionAnswerSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
  selections: z.array(z.object({ id: z.string(), label: z.string() })),
  maxes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        athleteId: z.string(),
        exerciseId: z.string(),
        value: z.number().finite().positive(),
        unit: z.enum(["kg", "lb"]),
      }),
    )
    .optional(),
});

export function parseSelectionAnswer(text: string | undefined) {
  try {
    const parsed = selectionAnswerSchema.safeParse(JSON.parse(text ?? ""));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function allowsMultipleSelections(request: InputRequest) {
  return request.display !== "confirmation" && request.action.input.selectionMode === "multiple";
}

export function selectionResponse(
  request: InputRequest,
  ids: readonly string[],
  cancelled = false,
  maxes: TrainingMaxAnswer[] = [],
): InputResponse {
  const selections = (request.options ?? [])
    .filter((option) => ids.includes(option.id))
    .map(({ id, label }) => ({ id, label }));
  return {
    requestId: request.requestId,
    ...(!cancelled && !allowsMultipleSelections(request) && selections.length === 1
      ? { optionId: selections[0].id }
      : {}),
    text: JSON.stringify({
      status: cancelled ? "cancelled" : "confirmed",
      selections,
      ...(trainingMaxFields(request).length ? { maxes } : {}),
    }),
  };
}

export function selectedResponseIds(response: InputResponse | undefined): string[] {
  return (
    parseSelectionAnswer(response?.text)?.selections.map(({ id }) => id) ??
    (response?.optionId ? [response.optionId] : [])
  );
}

export function isCancelledResponse(response: InputResponse) {
  return (
    response.optionId === "deny" ||
    response.text === CANCEL_INPUT_REQUEST_TEXT ||
    parseSelectionAnswer(response.text)?.status === "cancelled"
  );
}

// Validate presentation state only; the answer steers the model, not tool authorization.
export function isValidInputResponse(request: InputRequest, response: InputResponse) {
  if (response.requestId !== request.requestId) return false;
  if (request.display === "confirmation")
    return response.optionId === "approve" || response.optionId === "deny";
  const answer = parseSelectionAnswer(response.text);
  if (answer) {
    const fields = trainingMaxFields(request);
    const maxes = answer.maxes ?? [];
    if (
      new Set(maxes.map((item) => item.id)).size !== maxes.length ||
      maxes.some(
        (item) =>
          !fields.some(
            (field) =>
              field.id === item.id &&
              field.label === item.label &&
              field.athleteId === item.athleteId &&
              field.exerciseId === item.exerciseId,
          ),
      )
    )
      return false;
    const ids = answer.selections.map(({ id }) => id);
    return (
      (!response.optionId || (ids.length === 1 && ids[0] === response.optionId)) &&
      new Set(ids).size === ids.length &&
      (allowsMultipleSelections(request) || ids.length <= 1) &&
      (answer.status === "cancelled" || ids.length > 0 || fields.length > 0) &&
      answer.selections.every((selection) =>
        request.options?.some(
          (option) => option.id === selection.id && option.label === selection.label,
        ),
      )
    );
  }
  if (response.text === CANCEL_INPUT_REQUEST_TEXT) return true;
  if (trainingMaxFields(request).length) return false;
  if (response.optionId)
    return !!request.options?.some((option) => option.id === response.optionId);
  return (
    !!response.text?.trim() &&
    (request.allowFreeform || request.display === "text" || !request.options?.length)
  );
}
