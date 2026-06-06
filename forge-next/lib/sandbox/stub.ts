import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import type { RunPlanSandboxInput, RunSandboxResult } from "@/lib/sandbox/types";

/** Minimal valid plan for stub sandbox runs (unit tests / CI only). */
export function buildMinimalWorkoutPlan(name = "Generated Plan"): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name,
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Back Squat",
                sets: [
                  {
                    id: "w1d1-bs-1",
                    planned: {
                      type: "exact",
                      reps: 5,
                      load: { type: "absolute", value: 100, unit: "kg" },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Stub executor for unit tests and CI — returns current plan or a minimal valid plan.
 * Production plan-chat uses real Vercel Sandbox via `runPlanSandbox`.
 */
export async function runPlanSandboxStub(
  input: RunPlanSandboxInput,
): Promise<RunSandboxResult> {
  if (input.currentPlan) {
    return { ok: true, plan: input.currentPlan };
  }

  void input.generatedPython;
  return { ok: true, plan: buildMinimalWorkoutPlan() };
}
