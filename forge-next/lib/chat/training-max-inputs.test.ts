import { expect, it } from "vitest";
import type { InputRequest } from "eve/client";
import { trainingMaxFields } from "./training-max-inputs";
import { isValidInputResponse, selectionResponse } from "./input-selection";
const field = {
  id: "field",
  label: "Jay · Bench",
  athleteId: "10000000-0000-0000-0000-000000000001",
  exerciseId: "30000000-0000-0000-0000-000000000001",
  unit: "kg" as const,
};
const request: InputRequest = {
  requestId: "max",
  display: "text",
  prompt: "Optional max",
  action: {
    kind: "tool-call",
    callId: "max",
    toolName: "ask_question",
    input: { maxInputs: [field] },
  },
};
it("accepts optional values but rejects foreign identities, duplicates, invalid weights, and malformed answers", () => {
  expect(trainingMaxFields(request)).toEqual([field]);
  expect(isValidInputResponse(request, selectionResponse(request, []))).toBe(true);
  expect(
    isValidInputResponse(
      request,
      selectionResponse(request, [], false, [{ ...field, value: 100 }]),
    ),
  ).toBe(true);
  for (const maxes of [
    [{ ...field, athleteId: "other", value: 100 }],
    [{ ...field, value: -1 }],
    [
      { ...field, value: 100 },
      { ...field, value: 100 },
    ],
  ]) {
    expect(
      isValidInputResponse(request, {
        requestId: "max",
        text: JSON.stringify({ status: "confirmed", selections: [], maxes }),
      }),
    ).toBe(false);
  }
  expect(isValidInputResponse(request, { requestId: "max", text: "bad" })).toBe(false);
  expect(
    trainingMaxFields({
      ...request,
      action: { ...request.action, input: { maxInputs: [field, field] } },
    }),
  ).toEqual([]);
});
