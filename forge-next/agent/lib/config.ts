/** Agent runtime limits, sandbox paths, and shared plan seed defaults. */

export const SESSION_UPLOAD_READ_MAX_CHARS = 96_000;

export const MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN = 5;

export const CURRENT_PLAN_PATH = "current_plan.json";
export const RUN_SCRIPT_PATH = "run.py";
export const OUTPUT_PLAN_PATH = "output/plan.json";

export const EMPTY_PLAN_SEED = {
  schemaVersion: "3.1.0",
  name: "",
  weeks: [],
} as const;
