import { beforeEach, describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockRequireApiRole = vi.fn();
const mockCreateCoachPlan = vi.fn();
const mockPreparePlanForSave = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/plans/mutations", () => ({
  createCoachPlan: (...args: unknown[]) => mockCreateCoachPlan(...args),
}));

vi.mock("@/lib/plans/prepare-plan-for-save", () => ({
  preparePlanForSave: (...args: unknown[]) => mockPreparePlanForSave(...args),
}));

import { POST } from "@/app/api/coach/plans/route";

describe("POST /api/coach/plans", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockCreateCoachPlan.mockReset();
    mockPreparePlanForSave.mockReset();
    mockPreparePlanForSave.mockReturnValue({
      ok: true,
      plan: minimalWorkoutPlan,
    });
    mockCreateCoachPlan.mockResolvedValue({
      ok: true,
      planId: "plan-1",
      versionId: "version-1",
    });
  });

  it("returns 403 for non-coach users", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/coach/plans", {
        method: "POST",
        body: JSON.stringify({ plan: minimalWorkoutPlan, title: "Plan" }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("creates a plan for coaches", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });

    const response = await POST(
      new Request("http://localhost/api/coach/plans", {
        method: "POST",
        body: JSON.stringify({ plan: minimalWorkoutPlan, title: "Plan" }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      planId: "plan-1",
      versionId: "version-1",
    });
    expect(mockPreparePlanForSave).toHaveBeenCalledWith(minimalWorkoutPlan, "Plan");
    expect(mockCreateCoachPlan).toHaveBeenCalledWith(minimalWorkoutPlan, null);
  });
});
