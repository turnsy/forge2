import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockListAthletes = vi.fn();
const mockGetAthlete = vi.fn();
const mockListPlans = vi.fn();
const mockGetPlan = vi.fn();
const mockListVersions = vi.fn();
const mockListInvites = vi.fn();

vi.mock("@/lib/athletes/repository", () => ({
  listCoachAthletes: (...args: unknown[]) => mockListAthletes(...args),
}));

vi.mock("@/lib/links/repository", () => ({
  getCoachAthleteRelationship: (...args: unknown[]) => mockGetAthlete(...args),
  listCoachPendingInvites: (...args: unknown[]) => mockListInvites(...args),
}));

vi.mock("@/lib/plans/repository", () => ({
  listCoachPlans: (...args: unknown[]) => mockListPlans(...args),
  getCoachPlanById: (...args: unknown[]) => mockGetPlan(...args),
  listCoachPlanVersions: (...args: unknown[]) => mockListVersions(...args),
}));

import { createReadTools } from "@/lib/ai/coach-agent/tools/read-tools";

const toolCtx = { messages: [], toolCallId: "1" };
const coachId = "coach-1";

const samplePlan = makeWorkoutPlan({ name: "Summer Block" });

describe("createReadTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list_athletes passes q to repository", async () => {
    mockListAthletes.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
    });

    const tools = createReadTools({ coachId });
    await tools.list_athletes.execute!({ q: "Jane" }, toolCtx);

    expect(mockListAthletes).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Jane", page: 1, limit: 10 }),
    );
  });

  it("list_plans passes q to repository", async () => {
    mockListPlans.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
    });

    const tools = createReadTools({ coachId });
    await tools.list_plans.execute!({ q: "Summer" }, toolCtx);

    expect(mockListPlans).toHaveBeenCalledWith(
      coachId,
      expect.objectContaining({ q: "Summer", page: 1, limit: 10 }),
    );
  });

  it("get_plan returns summary without plan_data", async () => {
    mockGetPlan.mockResolvedValue({
      status: "ok",
      detail: {
        id: "plan-1",
        createdAt: "2026-01-01T00:00:00Z",
        plan: samplePlan,
      },
    });

    const tools = createReadTools({ coachId });
    const result = await tools.get_plan.execute!({ planId: "plan-1" }, toolCtx);

    expect(result).toMatchObject({
      ok: true,
      id: "plan-1",
      name: "Summer Block",
    });
    if ("summary" in result && result.ok) {
      expect(result.summary).toContain("Summer Block");
      expect(result.summary).not.toContain('"weeks"');
    }
    expect(result).not.toHaveProperty("plan_data");
  });

  it("get_athlete returns assignment metadata without workout content", async () => {
    mockGetAthlete.mockResolvedValue({
      relationshipId: "rel-1",
      status: "active",
      athleteId: "athlete-1",
      athleteName: "Jane",
      athleteEmail: "jane@example.com",
      linkedAt: "2026-01-01T00:00:00Z",
      currentPlanId: "plan-1",
      currentPlanName: "Summer Block",
    });

    const tools = createReadTools({ coachId });
    const result = await tools.get_athlete.execute!(
      { athleteId: "athlete-1" },
      toolCtx,
    );

    expect(result).toEqual({
      ok: true,
      athleteId: "athlete-1",
      name: "Jane",
      email: "jane@example.com",
      status: "active",
      linkedAt: "2026-01-01T00:00:00Z",
      currentPlanId: "plan-1",
      currentPlanName: "Summer Block",
    });
  });
});
