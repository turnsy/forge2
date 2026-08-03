import { describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { runPlanCodeInSandbox } from "@/agent/lib/run-plan-code";

describe("runPlanCodeInSandbox", () => {
  it("returns the validated plan when sandbox execution succeeds", async () => {
    const writeTextFile = vi.fn().mockResolvedValue(undefined);
    const readTextFile = vi
      .fn()
      .mockResolvedValue(JSON.stringify(minimalWorkoutPlan));
    const run = vi
      .fn()
      .mockResolvedValueOnce({ exitCode: 0 })
      .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" });

    const result = await runPlanCodeInSandbox({
      sandbox: { writeTextFile, run, readTextFile },
      seed: minimalWorkoutPlan,
      python: "plan = Plan.load()\nplan.save()",
    });

    expect(result).toEqual({ ok: true, plan: minimalWorkoutPlan });
    expect(writeTextFile).toHaveBeenCalledWith({
      path: "current_plan.json",
      content: JSON.stringify(minimalWorkoutPlan),
    });
    expect(run).toHaveBeenCalledWith({ command: "python3 run.py" });
  });

  it("returns sandbox failures", async () => {
    const result = await runPlanCodeInSandbox({
      sandbox: {
        writeTextFile: vi.fn().mockResolvedValue(undefined),
        readTextFile: vi.fn(),
        run: vi
          .fn()
          .mockResolvedValueOnce({ exitCode: 0 })
          .mockResolvedValueOnce({
            exitCode: 1,
            stderr: "Traceback",
            stdout: "",
          }),
      },
      seed: null,
      python: "raise Exception()",
    });

    expect(result).toEqual({
      ok: false,
      errors: [{ code: "SANDBOX_FAILED", message: "Traceback" }],
    });
  });

  it("returns validation errors for invalid output", async () => {
    const result = await runPlanCodeInSandbox({
      sandbox: {
        writeTextFile: vi.fn().mockResolvedValue(undefined),
        readTextFile: vi.fn().mockResolvedValue(JSON.stringify({ invalid: true })),
        run: vi
          .fn()
          .mockResolvedValueOnce({ exitCode: 0 })
          .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" }),
      },
      seed: null,
      python: "plan.save()",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
