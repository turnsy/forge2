import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import { migratePlanToBlocks } from "@/lib/plans/day-blocks";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type WorkoutPlanValidationError = {
  path: string;
  message: string;
};

export type WorkoutPlanLoadResult =
  | { ok: true; plan: WorkoutPlan }
  | { ok: false; errors: WorkoutPlanValidationError[] };

function getWorkoutPlanSchema(): object {
  const schemaPath = join(process.cwd(), "..", "schemas", "workout-plan.schema.json");
  return JSON.parse(readFileSync(schemaPath, "utf8")) as object;
}

let validateFn: ReturnType<Ajv2020["compile"]> | null = null;

function getValidator(): ReturnType<Ajv2020["compile"]> {
  if (!validateFn) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    validateFn = ajv.compile(getWorkoutPlanSchema());
  }

  return validateFn;
}

function mapValidationErrors(errors: ErrorObject[]): WorkoutPlanValidationError[] {
  return errors.map((error) => ({
    path: error.instancePath.length > 0 ? error.instancePath : "/",
    message: error.message ?? "Validation failed",
  }));
}

function preparePlanForValidation(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const schemaVersion = record.schemaVersion;
  if (
    schemaVersion === "2.0.0" ||
    (schemaVersion === "2.1.0" && Array.isArray(record.weeks))
  ) {
    return migratePlanToBlocks(value as WorkoutPlan);
  }

  return value;
}

export function loadWorkoutPlan(value: unknown): WorkoutPlanLoadResult {
  const validate = getValidator();
  const prepared = preparePlanForValidation(value);

  if (validate(prepared)) {
    return { ok: true, plan: prepared as WorkoutPlan };
  }

  return {
    ok: false,
    errors: mapValidationErrors(validate.errors ?? []),
  };
}
