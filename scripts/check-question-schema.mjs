import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../forge-next/", import.meta.url);
const { ASK_QUESTION_INPUT_SCHEMA } = await import(
  new URL("node_modules/eve/dist/src/runtime/framework-tools/ask-question.js", root).href
);
const schema = JSON.parse(
  readFileSync(new URL("schemas/training-max-fields.schema.json", root), "utf8"),
);
assert.deepEqual(
  ASK_QUESTION_INPUT_SCHEMA.properties.maxInputs,
  schema,
  "Eve's max input contract must match its JSON Schema source",
);
console.log("Eve question schema matches optional training-max fields.");

const metadataSchema = JSON.parse(readFileSync(new URL("schemas/metadata-editor-input.schema.json", root), "utf8"));
delete metadataSchema.$schema;
assert.deepEqual(ASK_QUESTION_INPUT_SCHEMA.properties.metadataEditor, metadataSchema, "Eve metadata editor contract must match its JSON Schema source");
