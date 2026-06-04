/** Sandbox paths and timing for plan codegen runs. */

export const SANDBOX_RUNTIME = "python3.13" as const;

export const SANDBOX_WORKDIR = "/vercel/sandbox" as const;

export const CURRENT_PLAN_PATH = "current_plan.json";

export const RUN_SCRIPT_PATH = "run.py";

export const OUTPUT_PLAN_PATH = "output/plan.json";

/** Sandbox auto-stop (ms). */
export const SANDBOX_LIFETIME_MS = 5 * 60 * 1000;

/** Max time to wait for `python3 run.py`. */
export const SANDBOX_COMMAND_TIMEOUT_MS = 60 * 1000;
