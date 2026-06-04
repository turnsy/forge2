import { describe, expect, it, vi } from "vitest";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";
import {
  CURRENT_PLAN_PATH,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
} from "@/lib/sandbox/constants";
import { runPlanSandboxLive } from "@/lib/sandbox/live";
import { loadWorkoutPlan } from "@/lib/plans/validate";

const EXAMPLE_RUN_PY = `
from forge_plan import Plan

plan = Plan.from_json_file("current_plan.json")
if plan.is_empty():
    plan = Plan.empty("Sandbox Plan")
plan.add_week(index=1, label="Week 1")
plan.add_day(week_index=1, index=1, code="w1d1")
plan.add_exercise(week_index=1, day_index=1, name="Back Squat")
plan.add_set(1, 1, 0, reps=5, load_value=100, unit="kg")
plan.write_json("output/plan.json")
`.trim();

function createMockSandbox(options?: {
  exitCode?: number;
  outputPlan?: object | null;
  stderr?: string;
  throwOnRun?: Error;
}) {
  const writtenPaths: string[] = [];
  const outputPlan =
    options?.outputPlan === undefined
      ? buildMinimalWorkoutPlan("Sandbox Plan")
      : options.outputPlan;

  return {
    writtenPaths,
    sandbox: {
      writeFiles: vi.fn(async (files: { path: string }[]) => {
        writtenPaths.push(...files.map((file) => file.path));
      }),
      mkDir: vi.fn(async () => undefined),
      runCommand: vi.fn(async () => {
        if (options?.throwOnRun) {
          throw options.throwOnRun;
        }
        return {
          exitCode: options?.exitCode ?? 0,
          stdout: async () => "",
          stderr: async () => options?.stderr ?? "",
        };
      }),
      readFileToBuffer: vi.fn(async () => {
        if (outputPlan === null) {
          return null;
        }
        return Buffer.from(JSON.stringify(outputPlan));
      }),
      stop: vi.fn(async () => undefined),
    },
  };
}

describe("runPlanSandboxLive", () => {
  it("writes only plan seed, library, and run.py", async () => {
    const { sandbox, writtenPaths } = createMockSandbox();

    await runPlanSandboxLive(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox },
    );

    expect(writtenPaths).toContain(CURRENT_PLAN_PATH);
    expect(writtenPaths).toContain(RUN_SCRIPT_PATH);
    expect(writtenPaths.some((path) => path.startsWith("forge_plan/"))).toBe(true);
    expect(
      writtenPaths.every(
        (path) =>
          path === CURRENT_PLAN_PATH ||
          path === RUN_SCRIPT_PATH ||
          path.startsWith("forge_plan/"),
      ),
    ).toBe(true);
    expect(sandbox.stop).toHaveBeenCalled();
  });

  it("returns validated plan on success", async () => {
    const { sandbox } = createMockSandbox();
    const result = await runPlanSandboxLive(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(loadWorkoutPlan(result.plan).ok).toBe(true);
    }
  });

  it("returns MISSING_OUTPUT when plan.json is absent", async () => {
    const { sandbox } = createMockSandbox({ outputPlan: null });
    const result = await runPlanSandboxLive(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox },
    );

    expect(result).toEqual({
      ok: false,
      code: "MISSING_OUTPUT",
      message: `${OUTPUT_PLAN_PATH} was not produced by run.py`,
    });
    expect(sandbox.stop).toHaveBeenCalled();
  });

  it("returns SANDBOX_FAILED on non-zero exit", async () => {
    const { sandbox } = createMockSandbox({ exitCode: 1, stderr: "SyntaxError" });
    const result = await runPlanSandboxLive(
      { currentPlan: null, generatedPython: "raise SystemExit(1)" },
      { createSandbox: async () => sandbox },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("SANDBOX_FAILED");
      expect(result.message).toContain("SyntaxError");
    }
  });

  it("returns SANDBOX_TIMEOUT on AbortError", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    const { sandbox } = createMockSandbox({ throwOnRun: abort });

    const result = await runPlanSandboxLive(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox },
    );

    expect(result).toEqual({
      ok: false,
      code: "SANDBOX_TIMEOUT",
      message: expect.stringContaining("timed out"),
    });
  });

  it("passes current plan as seed JSON", async () => {
    const { sandbox, writtenPaths } = createMockSandbox();
    const seed = buildMinimalWorkoutPlan("Kept");

    await runPlanSandboxLive(
      { currentPlan: seed, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox },
    );

    const writeCall = vi.mocked(sandbox.writeFiles).mock.calls[0]?.[0];
    const currentFile = writeCall?.find((file) => file.path === CURRENT_PLAN_PATH);
    expect(currentFile?.content).toContain('"Kept"');
    expect(writtenPaths).not.toContain("input_context.json");
    expect(writtenPaths).not.toContain("schema.json");
  });
});
