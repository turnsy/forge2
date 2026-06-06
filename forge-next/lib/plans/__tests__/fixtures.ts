import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export const minimalWorkoutPlan: WorkoutPlan = {
  schemaVersion: "2.0.0",
  name: "4-Week Strength Block",
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
