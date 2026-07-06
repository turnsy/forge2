import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import workoutPlanSchema from "@/schemas/workout-plan.schema.json";

export type WorkoutPlanValidationError = {
  path: string;
  message: string;
};

export type WorkoutPlanLoadResult =
  | { ok: true; plan: WorkoutPlan }
  | { ok: false; errors: WorkoutPlanValidationError[] };

function getWorkoutPlanSchema(): object {
  return workoutPlanSchema;
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

export function loadWorkoutPlan(value: unknown): WorkoutPlanLoadResult {
  const validate = getValidator();

  if (validate(value)) {
    return { ok: true, plan: value as WorkoutPlan };
  }

  return {
    ok: false,
    errors: mapValidationErrors(validate.errors ?? []),
  };
}
