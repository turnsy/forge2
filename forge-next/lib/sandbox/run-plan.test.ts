import { describe, expect, it, vi } from "vitest";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";
import {
  CURRENT_PLAN_PATH,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
} from "@/lib/sandbox/constants";
import { runPlanSandbox } from "@/lib/sandbox/run-plan";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import { Sandbox } from "@vercel/sandbox";

const EXAMPLE_RUN_PY = `
from forge_plan import Plan

plan = Plan.from_json_file("current_plan.json")
if plan.is_empty():
    plan = Plan.empty("Sandbox Plan")
plan.add_week(label="Week 1")
plan.add_day(week_index=1)
plan.add_exercise(week_index=1, day_index=1, name="Back Squat")
plan.add_set(week_index=1, day_index=1, reps=5, load_value=100, unit="kg")
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

  const sandbox = {
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
  };

  return { writtenPaths, sandbox };
}

describe("runPlanSandbox", () => {
  it("writes only plan seed, library, and run.py", async () => {
    const { sandbox, writtenPaths } = createMockSandbox();

    await runPlanSandbox(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox as never },
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
    const result = await runPlanSandbox(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox as never },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(loadWorkoutPlan(result.plan).ok).toBe(true);
    }
  });

  it("returns MISSING_OUTPUT when plan.json is absent", async () => {
    const { sandbox } = createMockSandbox({ outputPlan: null });
    const result = await runPlanSandbox(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox as never },
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
    const result = await runPlanSandbox(
      { currentPlan: null, generatedPython: "raise SystemExit(1)" },
      { createSandbox: async () => sandbox as never },
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

    const result = await runPlanSandbox(
      { currentPlan: null, generatedPython: EXAMPLE_RUN_PY },
      { createSandbox: async () => sandbox as never },
    );

    expect(result).toEqual({
      ok: false,
      code: "SANDBOX_TIMEOUT",
      message: expect.stringContaining("timed out"),
    });
  });

  it("uses Sandbox.create by default", async () => {
    const createSpy = vi.spyOn(Sandbox, "create");
    const { sandbox } = createMockSandbox();
    createSpy.mockResolvedValueOnce(sandbox as never);

    await runPlanSandbox({ currentPlan: null, generatedPython: EXAMPLE_RUN_PY });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        runtime: "python3.13",
        persistent: false,
        networkPolicy: "deny-all",
      }),
    );

    createSpy.mockRestore();
  });
});
