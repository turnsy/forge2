import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRpc = vi.fn();

vi.mock("@/utils/supabase/data-client", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
  })),
}));

import {
  assignPlanToAthletes,
  deleteCoachPlan,
  getCoachPlanDeleteInfo,
} from "@/lib/plans/mutations";

describe("plan mutations", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("assigns a plan to athletes via rpc", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(
      assignPlanToAthletes("plan-1", ["athlete-1", "athlete-2"]),
    ).resolves.toEqual({ ok: true });

    expect(mockRpc).toHaveBeenCalledWith("assign_plan_to_athletes", {
      p_plan_id: "plan-1",
      p_athlete_ids: ["athlete-1", "athlete-2"],
    });
  });

  it("rejects empty athlete selection before rpc", async () => {
    await expect(assignPlanToAthletes("plan-1", [])).resolves.toEqual({
      ok: false,
      code: "validation_error",
      message: "Select at least one athlete",
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("deletes a plan via rpc", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(deleteCoachPlan("plan-1")).resolves.toEqual({ ok: true });
    expect(mockRpc).toHaveBeenCalledWith("delete_coach_plan", {
      p_plan_id: "plan-1",
    });
  });

  it("returns delete info from rpc", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          plan_title: "4-Week Block",
          active_assignment_count: 2,
        },
      ],
      error: null,
    });

    await expect(getCoachPlanDeleteInfo("plan-1")).resolves.toEqual({
      ok: true,
      planTitle: "4-Week Block",
      activeAssignmentCount: 2,
    });
  });

  it("reuses an injected client instead of creating another one", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    await expect(
      assignPlanToAthletes("plan-1", ["athlete-1"], client as never),
    ).resolves.toEqual({ ok: true });

    expect(client.rpc).toHaveBeenCalledWith("assign_plan_to_athletes", {
      p_plan_id: "plan-1",
      p_athlete_ids: ["athlete-1"],
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("maps rpc errors", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Plan not found" },
    });

    await expect(deleteCoachPlan("plan-1")).resolves.toEqual({
      ok: false,
      code: "not_found",
      message: "Plan not found",
    });
  });
});
