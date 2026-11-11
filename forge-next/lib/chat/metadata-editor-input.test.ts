import { expect, it } from "vitest";
import type { InputRequest } from "eve/client";
import { metadataEditorInput } from "./metadata-editor-input";
import {
  isValidInputResponse,
  selectionResponse,
  chatInputResponse,
} from "./input-selection";
const request = (metadataEditor: unknown): InputRequest => ({
  requestId: "q",
  prompt: "Complete profile",
  display: "text",
  action: {
    kind: "tool-call",
    toolName: "ask_question",
    callId: "q",
    input: { metadataEditor: JSON.parse(JSON.stringify(metadataEditor)) },
  },
});
it("supports both shared editors, validates athlete identity, and accepts continuation without option selections", () => {
  const r = request({
    mode: "athlete",
    athleteId: "30000000-0000-4000-8000-000000000001",
  });
  expect(metadataEditorInput(r)).not.toBeNull();
  expect(isValidInputResponse(r, selectionResponse(r, []))).toBe(true);
  expect(isValidInputResponse(r, selectionResponse(r, [], true))).toBe(true);
  expect(
    isValidInputResponse(r, chatInputResponse(r, "Accept and complete later")),
  ).toBe(true);
  expect(metadataEditorInput(request({ mode: "fields" }))).toEqual({
    mode: "fields",
  });
  expect(
    metadataEditorInput(request({ mode: "athlete", athleteId: "invented" })),
  ).toBeNull();
  expect(
    metadataEditorInput(request({ mode: "fields", extra: true })),
  ).toBeNull();
});
