import { beforeEach, describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockRequireApiRole = vi.fn();
const mockGetCoachPlanById = vi.fn();
const mockListCoachPlanVersions = vi.fn();
const mockSaveCoachPlanVersion = vi.fn();
const mockPreparePlanForSave = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/plans/repository", () => ({
  getCoachPlanById: (...args: unknown[]) => mockGetCoachPlanById(...args),
  listCoachPlanVersions: (...args: unknown[]) => mockListCoachPlanVersions(...args),
}));

vi.mock("@/lib/plans/mutations", () => ({
  saveCoachPlanVersion: (...args: unknown[]) => mockSaveCoachPlanVersion(...args),
}));

vi.mock("@/lib/plans/utils", () => ({
  preparePlanForSave: (...args: unknown[]) => mockPreparePlanForSave(...args),
}));

import { GET, POST } from "@/app/api/coach/plans/[planId]/versions/route";

const context = { params: Promise.resolve({ planId: "plan-1" }) };

describe("/api/coach/plans/[planId]/versions", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockGetCoachPlanById.mockReset();
    mockListCoachPlanVersions.mockReset();
    mockSaveCoachPlanVersion.mockReset();
    mockPreparePlanForSave.mockReset();

    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });
    mockGetCoachPlanById.mockResolvedValue({
      status: "ok",
      detail: {
        id: "plan-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        plan: minimalWorkoutPlan,
      },
    });
    mockListCoachPlanVersions.mockResolvedValue([
      {
        id: "version-1",
        changeSummary: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        createdBy: "coach-1",
        isActive: true,
      },
    ]);
    mockPreparePlanForSave.mockReturnValue({
      ok: true,
      plan: minimalWorkoutPlan,
    });
    mockSaveCoachPlanVersion.mockResolvedValue({
      ok: true,
      versionId: "version-2",
    });
  });

  it("lists versions for an owned plan", async () => {
    const response = await GET(
      new Request("http://localhost/api/coach/plans/plan-1/versions"),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      versions: [
        expect.objectContaining({ id: "version-1", isActive: true }),
      ],
    });
  });

  it("saves a new version", async () => {
    const response = await POST(
      new Request("http://localhost/api/coach/plans/plan-1/versions", {
        method: "POST",
        body: JSON.stringify({ plan: minimalWorkoutPlan, title: "Updated" }),
      }),
      context,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ versionId: "version-2" });
    expect(mockSaveCoachPlanVersion).toHaveBeenCalledWith(
      "plan-1",
      minimalWorkoutPlan,
      null,
    );
  });
});
