import { describe, expect, it, vi } from "vitest";
import { executeSubmitPlanCode } from "@/lib/ai/plan-chat/tools/execute-submit-plan-code";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";

describe("executeSubmitPlanCode", () => {
  it("returns plan when sandbox and validation succeed", async () => {
    const plan = buildMinimalWorkoutPlan("Built");
    const runSandbox = vi.fn().mockResolvedValue({ ok: true, plan });
    const onRunStatus = vi.fn();

    const result = await executeSubmitPlanCode({
      python: "print('plan')",
      currentPlan: null,
      runSandbox,
      onRunStatus,
    });

    expect(result).toEqual({ ok: true, plan });
    expect(runSandbox).toHaveBeenCalledWith({
      artifact: {
        type: "plan",
        currentPlan: null,
        generatedPython: "print('plan')",
      },
    });
    expect(onRunStatus).toHaveBeenCalledWith("sandbox");
    expect(onRunStatus).toHaveBeenCalledWith("validating");
  });

  it("returns sandbox errors without validating", async () => {
    const runSandbox = vi.fn().mockResolvedValue({
      ok: false,
      code: "SANDBOX_TIMEOUT",
      message: "Timed out",
    });
    const onRunStatus = vi.fn();

    const result = await executeSubmitPlanCode({
      python: "while True: pass",
      currentPlan: null,
      runSandbox,
      onRunStatus,
    });

    expect(result).toEqual({
      ok: false,
      errors: [{ code: "SANDBOX_TIMEOUT", message: "Timed out" }],
    });
    expect(onRunStatus).toHaveBeenCalledWith("sandbox");
    expect(onRunStatus).not.toHaveBeenCalledWith("validating");
  });

  it("returns validation errors when sandbox output is invalid", async () => {
    const runSandbox = vi.fn().mockResolvedValue({
      ok: true,
      plan: { schemaVersion: "1.0.0", name: "Invalid" },
    });

    const result = await executeSubmitPlanCode({
      python: "print('bad')",
      currentPlan: null,
      runSandbox,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatchObject({
        path: expect.any(String),
        message: expect.any(String),
      });
    }
  });
});
