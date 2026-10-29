import type { InputRequest } from "eve/client";
import Ajv from "ajv";
import schema from "@/schemas/metadata-editor-input.schema.json";
export type MetadataEditorInput =
  | { mode: "fields" }
  | { mode: "athlete"; athleteId: string };
const validate = new Ajv().compile<MetadataEditorInput>(schema);
export function metadataEditorInput(
  request: InputRequest,
): MetadataEditorInput | null {
  const value = request.action.input.metadataEditor;
  return validate(value) ? value : null;
}
