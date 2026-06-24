#!/usr/bin/env node
/** Validate a workout plan JSON file against schemas/workout-plan.schema.json. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node validate-plan-json.mjs <path-to-plan.json>");
  process.exit(2);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "..", "schemas", "workout-plan.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const data = JSON.parse(readFileSync(filePath, "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

if (!validate(data)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log("ok");
