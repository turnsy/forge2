import { beforeEach, describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

vi.mock("./repository", () => ({ findExactExercise: vi.fn(), createCoachExercise: vi.fn() }));
vi.mock("./confirm-selection", () => ({ getAccessibleExercise: vi.fn() }));
import { findExactExercise, createCoachExercise } from "./repository";
import { getAccessibleExercise } from "./confirm-selection";
import { preparePlanExerciseResolution } from "./prepare-plan";

const record = (id: string, name: string) => ({ id, name, normalized_name: name.toLowerCase(), owner_coach_id: null });
const makePlan = () => structuredClone(minimalWorkoutPlan);

describe("preparePlanExerciseResolution", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(findExactExercise).mockResolvedValue(null);
    vi.mocked(createCoachExercise).mockImplementation(async (name) => record("new-id", name));
  });

  it("uses exact matches without creating exercises", async () => {
    vi.mocked(findExactExercise).mockResolvedValue(record("squat", "Back Squat"));
    const result = await preparePlanExerciseResolution(makePlan(), "coach");
    expect(result.weeks[0].days[0].blocks[0].exercises[0].resolvedExerciseId).toBe("squat");
    expect(createCoachExercise).not.toHaveBeenCalled();
  });

  it("preserves an accessible explicit selection instead of choosing another exact match", async () => {
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].resolvedExerciseId = "private-squat";
    vi.mocked(getAccessibleExercise).mockResolvedValue(record("private-squat", "Back Squat"));
    const result = await preparePlanExerciseResolution(plan, "coach");
    expect(result.weeks[0].days[0].blocks[0].exercises[0].resolvedExerciseId).toBe("private-squat");
    expect(findExactExercise).not.toHaveBeenCalled();
  });

  it("creates unmatched imported names and preserves parenthetical variants", async () => {
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].name = "Bench Press (dumbbell)";
    await preparePlanExerciseResolution(plan, "coach");
    expect(createCoachExercise).toHaveBeenCalledWith("Bench Press (dumbbell)", "coach");
  });

  it("resolves renamed exercises instead of reusing stale IDs", async () => {
    const plan = makePlan();
    const exercise = plan.weeks[0].days[0].blocks[0].exercises[0];
    exercise.name = "Bench Press";
    exercise.resolvedExerciseId = "squat";
    vi.mocked(getAccessibleExercise).mockResolvedValue(record("squat", "Back Squat"));
    vi.mocked(findExactExercise).mockResolvedValue(record("bench", "Bench Press"));
    const result = await preparePlanExerciseResolution(plan, "coach");
    expect(result.weeks[0].days[0].blocks[0].exercises[0].resolvedExerciseId).toBe("bench");
    expect(exercise.resolvedExerciseId).toBe("squat");
  });

  it("rejects inaccessible supplied IDs", async () => {
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].resolvedExerciseId = "another-coach-id";
    vi.mocked(getAccessibleExercise).mockResolvedValue(null);
    await expect(preparePlanExerciseResolution(plan, "coach")).rejects.toThrow("not accessible");
    expect(createCoachExercise).not.toHaveBeenCalled();
  });

  it("caches repeated imported names and resolves a custom percentage basis", async () => {
    const plan = makePlan();
    const exercises = plan.weeks[0].days[0].blocks[0].exercises;
    exercises.push(structuredClone(exercises[0]));
    exercises[0].basisRaw = "Front Squat";
    await preparePlanExerciseResolution(plan, "coach");
    expect(createCoachExercise).toHaveBeenCalledTimes(2);
    expect(createCoachExercise).toHaveBeenCalledWith("Front Squat", "coach");
  });

  it("removes a stale basis ID when the basis returns to the exercise name", async () => {
    const plan = makePlan();
    const exercise = plan.weeks[0].days[0].blocks[0].exercises[0];
    exercise.basisRaw = " back  squat ";
    exercise.resolvedBasisExerciseId = "stale-basis";
    const result = await preparePlanExerciseResolution(plan, "coach");
    expect(result.weeks[0].days[0].blocks[0].exercises[0]).not.toHaveProperty("resolvedBasisExerciseId");
  });
});
