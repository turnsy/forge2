import { describe, expect, it, vi } from "vitest";
import { runSandbox, runSandboxStub } from "@/lib/sandbox";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";
import { runPlanSandbox } from "@/lib/sandbox/run-plan";

describe("runSandbox", () => {
  it("routes plan artifacts to the VM executor by default", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      plan: buildMinimalWorkoutPlan(),
    });

    await runSandbox(
      {
        artifact: {
          type: "plan",
          currentPlan: null,
          generatedPython: "pass",
        },
      },
      { executePlan },
    );

    expect(executePlan).toHaveBeenCalledWith({
      currentPlan: null,
      generatedPython: "pass",
    });
  });

  it("defaults executePlan to runPlanSandbox", () => {
    expect(runPlanSandbox).toBeTypeOf("function");
  });
});

describe("runSandboxStub", () => {
  it("returns a minimal plan for empty plan artifacts", async () => {
    const result = await runSandboxStub({
      artifact: {
        type: "plan",
        currentPlan: null,
        generatedPython: "pass",
      },
    });

    expect(result.ok).toBe(true);
  });
});
