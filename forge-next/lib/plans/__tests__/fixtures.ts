import type {
  Block,
  Day,
  Exercise,
  Set,
  Week,
  WorkoutPlan,
} from "@/lib/plans/workout-plan";

export const minimalWorkoutPlan: WorkoutPlan = {
  schemaVersion: "3.0.0",
  name: "4-Week Strength Block",
  weeks: [
    {
      days: [
        {
          code: "w1d1",
          blocks: [
            {
              id: "w1d1-b1",
              exercises: [
                {
                  id: "back-squat",
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
    },
  ],
};

export function makeSet(overrides: Partial<Set> & Pick<Set, "id">): Set {
  return {
    planned: {
      type: "exact",
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    },
    actual: null,
    status: "planned",
    locked: false,
    ...overrides,
  };
}

export function makeExercise(
  overrides: Partial<Exercise> & Pick<Exercise, "name">,
): Exercise {
  return {
    id: overrides.id ?? `${overrides.name.toLowerCase().replace(/\s+/g, "-")}`,
    sets: [
      makeSet({ id: "set-1" }),
    ],
    ...overrides,
  };
}

export function makeBlock(
  overrides: Partial<Block> & { exercises: Exercise[] },
): Block {
  return {
    id: overrides.id ?? "block-1",
    ...overrides,
  };
}

export function makeDay(overrides: Partial<Day> & Pick<Day, "code">): Day {
  return {
    blocks: [
      makeBlock({
        id: `${overrides.code}-b1`,
        exercises: [makeExercise({ id: "ex-1", name: "Back Squat", sets: [makeSet({ id: `${overrides.code}-bs-1` })] })],
      }),
    ],
    ...overrides,
  };
}

export function makeWeek(overrides: Partial<Week> = {}): Week {
  return {
    days: [makeDay({ code: "w1d1" })],
    ...overrides,
  };
}

export type MakeWorkoutPlanOptions = {
  dayComplete?: boolean;
  includeSkippedSet?: boolean;
  exerciseNotes?: string;
  setNotes?: string;
  name?: string;
  multiDay?: boolean;
};

export function makeWorkoutPlan(options: MakeWorkoutPlanOptions = {}): WorkoutPlan {
  const sets: Set[] = [
    makeSet({
      id: "w1d1-bs-1",
      planned: {
        type: "exact",
        reps: 8,
        load: { type: "absolute", value: 60, unit: "kg" },
        notes: options.setNotes,
      },
      actual: options.dayComplete
        ? { reps: 8, load: { type: "absolute", value: 60, unit: "kg" } }
        : null,
      status: options.dayComplete ? "completed" : "planned",
    }),
  ];

  if (options.includeSkippedSet) {
    sets.push(
      makeSet({
        id: "w1d1-bs-2",
        planned: {
          type: "exact",
          reps: 5,
          load: { type: "absolute", value: 80, unit: "kg" },
        },
        status: "skipped",
      }),
    );
  }

  const days = [
    makeDay({
      code: "w1d1",
      blocks: [
        makeBlock({
          id: "w1d1-b1",
          exercises: [
            makeExercise({
              id: "back-squat",
              name: "Back Squat",
              notes: options.exerciseNotes,
              sets: sets as Exercise["sets"],
            }),
          ],
        }),
      ],
    }),
  ];

  if (options.multiDay) {
    days.push(
      makeDay({
        code: "w1d2",
        blocks: [
          makeBlock({
            id: "w1d2-b1",
            exercises: [
              makeExercise({
                id: "bench-press",
                name: "Bench Press",
                sets: [makeSet({ id: "w1d2-bp-1" })] as Exercise["sets"],
              }),
            ],
          }),
        ],
      }),
    );
  }

  return {
    schemaVersion: "3.0.0",
    name: options.name ?? "Strength Block",
    weeks: [{ days: days as Week["days"] }],
  };
}
