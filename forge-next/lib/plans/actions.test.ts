import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAssignPlanToAthletes = vi.fn();
const mockDeleteCoachPlan = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/plans/mutations", () => ({
  assignPlanToAthletes: (...args: unknown[]) => mockAssignPlanToAthletes(...args),
  deleteCoachPlan: (...args: unknown[]) => mockDeleteCoachPlan(...args),
}));

import {
  assignPlanToAthleteAction,
  assignPlanToAthletesAction,
  deleteCoachPlanAction,
} from "@/lib/plans/actions";

describe("plan actions", () => {
  beforeEach(() => {
    mockAssignPlanToAthletes.mockReset();
    mockDeleteCoachPlan.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("assigns a plan to athletes and revalidates coach pages", async () => {
    mockAssignPlanToAthletes.mockResolvedValue({ ok: true });

    const result = await assignPlanToAthletesAction("plan-1", [
      "athlete-1",
      "athlete-2",
    ]);

    expect(result).toEqual({ ok: true });
    expect(mockAssignPlanToAthletes).toHaveBeenCalledWith("plan-1", [
      "athlete-1",
      "athlete-2",
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/plans");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/plans/plan-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/athletes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/athletes/athlete-1");
  });

  it("assigns a plan to a single athlete via the shared RPC", async () => {
    mockAssignPlanToAthletes.mockResolvedValue({ ok: true });

    const result = await assignPlanToAthleteAction("plan-1", "athlete-1");

    expect(result).toEqual({ ok: true });
    expect(mockAssignPlanToAthletes).toHaveBeenCalledWith("plan-1", ["athlete-1"]);
  });

  it("returns mutation errors from assign action", async () => {
    mockAssignPlanToAthletes.mockResolvedValue({
      ok: false,
      code: "not_found",
      message: "Plan not found",
    });

    const result = await assignPlanToAthletesAction("plan-1", ["athlete-1"]);

    expect(result).toEqual({ ok: false, error: "Plan not found" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("deletes a plan and revalidates coach pages", async () => {
    mockDeleteCoachPlan.mockResolvedValue({ ok: true });

    const result = await deleteCoachPlanAction("plan-1");

    expect(result).toEqual({ ok: true });
    expect(mockDeleteCoachPlan).toHaveBeenCalledWith("plan-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/plans");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/athletes");
  });
});
