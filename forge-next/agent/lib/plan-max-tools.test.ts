import { beforeEach, expect, it, vi } from "vitest";
import type { ToolContext } from "eve/tools";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
vi.mock("./with-forge-db", () => ({
  withForgeDbContextAsync: (_ctx: unknown, fn: () => unknown) => fn(),
}));
vi.mock("./plans", () => ({ fetchCoachPlanForTool: vi.fn() }));
vi.mock("@/lib/links/repository", () => ({ getCoachAthleteRelationship: vi.fn() }));
vi.mock("@/lib/maxes/mutations", () => ({ listAthleteMaxes: vi.fn(), insertAthleteMax: vi.fn() }));
vi.mock("@/lib/exercises/confirm-selection", () => ({ getAccessibleExercise: vi.fn() }));
import check from "../tools/check_plan_maxes";
import set from "../tools/set_athlete_max";
import { fetchCoachPlanForTool } from "./plans";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { listAthleteMaxes, insertAthleteMax } from "@/lib/maxes/mutations";
import { getAccessibleExercise } from "@/lib/exercises/confirm-selection";
const ctx = { session: { auth: { current: { principalId: "coach" } } } } as unknown as ToolContext;
beforeEach(() => vi.resetAllMocks());
it("requires coach authentication before reading or writing maxes", async () => {
  const anonymous = { session: { auth: {} } } as unknown as ToolContext;
  await expect(check.execute({ planId: "plan", athleteIds: ["athlete"] }, anonymous)).rejects.toThrow("Coach authentication required");
  await expect(set.execute({ athleteId: "athlete", exerciseId: "bench", value: 100, unit: "kg" }, anonymous)).rejects.toThrow("Coach authentication required");
  expect(fetchCoachPlanForTool).not.toHaveBeenCalled();
  expect(insertAthleteMax).not.toHaveBeenCalled();
});
it("checks only the percentage basis and returns optional input fields", async () => {
  const plan = structuredClone(minimalWorkoutPlan);
  const exercise = plan.weeks[0].days[0].blocks[0].exercises[0];
  exercise.resolvedExerciseId = "close-grip";
  exercise.resolvedBasisExerciseId = "bench";
  exercise.basisRaw = "Bench";
  exercise.sets[0].planned.target = { type: "percentage", value: 75, unit: "kg" };
  vi.mocked(fetchCoachPlanForTool).mockResolvedValue({ ok: true, detail: { plan } } as Awaited<
    ReturnType<typeof fetchCoachPlanForTool>
  >);
  vi.mocked(getCoachAthleteRelationship).mockResolvedValue({
    status: "active",
    athleteName: "Jay",
  } as Awaited<ReturnType<typeof getCoachAthleteRelationship>>);
  vi.mocked(listAthleteMaxes).mockResolvedValue([]);
  const result = await check.execute({ planId: "plan", athleteIds: ["athlete"] }, ctx);
  expect(result).toMatchObject({
    ok: true,
    canAssignWithoutMaxes: true,
    maxInputs: [{ exerciseId: "bench", athleteId: "athlete", label: "Jay · Bench" }],
  });
  expect(listAthleteMaxes).toHaveBeenCalledWith("athlete", ["bench"]);
  vi.mocked(listAthleteMaxes).mockResolvedValue([
    { exercise_id: "bench", value: 100, unit: "kg", logged_at: "2026-01-01" },
  ] as Awaited<ReturnType<typeof listAthleteMaxes>>);
  expect(await check.execute({ planId: "plan", athleteIds: ["athlete"] }, ctx)).toMatchObject({
    maxInputs: [],
  });
});
it("uses an explicit coach-entered source and rejects global/foreign exercise identities", async () => {
  vi.mocked(getAccessibleExercise).mockResolvedValue({
    id: "bench",
    owner_coach_id: "coach",
  } as Awaited<ReturnType<typeof getAccessibleExercise>>);
  await set.execute({ athleteId: "athlete", exerciseId: "bench", value: 90, unit: "kg" }, ctx);
  expect(insertAthleteMax).toHaveBeenCalledWith({
    athleteId: "athlete",
    exerciseId: "bench",
    value: 90,
    unit: "kg",
    source: "coach_entered",
  });
  vi.mocked(insertAthleteMax).mockClear();
  vi.mocked(getAccessibleExercise).mockResolvedValue({
    id: "global",
    owner_coach_id: null,
  } as Awaited<ReturnType<typeof getAccessibleExercise>>);
  expect(
    await set.execute({ athleteId: "athlete", exerciseId: "global", value: 90, unit: "kg" }, ctx),
  ).toMatchObject({ ok: false });
  expect(insertAthleteMax).not.toHaveBeenCalled();
});
