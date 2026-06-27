/** Max characters returned from read_session_file (tool output). */
export const SESSION_UPLOAD_READ_MAX_CHARS = 48_000;

export const CURRENT_PLAN_PATH = "current_plan.json";
export const RUN_SCRIPT_PATH = "run.py";
export const OUTPUT_PLAN_PATH = "output/plan.json";

export const EMPTY_PLAN_SEED = {
  schemaVersion: "3.0.0",
  name: "",
  weeks: [],
} as const;
