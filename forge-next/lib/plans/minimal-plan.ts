import type { WorkoutPlan } from "@/lib/plans/workout-plan";

/** Minimal valid plan for sandbox stubs and smoke tests. */
export function buildMinimalWorkoutPlan(name = "Generated Plan"): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name,
    weeks: [
      {
        days: [
          {
            code: "w1d1",
            blocks: [
              {
                id: "block-1",
                exercises: [
                  {
                    id: "back-squat",
                    name: "Back Squat",
                    sets: [
                      {
                        id: "w1d1-bs-1",
                        planned: {
                          type: "exact",
                          reps: 8,
                          target: { type: "absolute", value: 60, unit: "kg" },
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
      },
    ],
  };
}
