import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiRole = vi.fn();
const mockListCoachPlans = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/plans/repository", () => ({
  listCoachPlans: (...args: unknown[]) => mockListCoachPlans(...args),
}));

import { GET } from "@/app/api/coach/plans/route";

describe("GET /api/coach/plans", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockListCoachPlans.mockReset();
    mockListCoachPlans.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
    });
  });

  it("returns 403 for non-coach users", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      }),
    });

    const response = await GET(new Request("http://localhost/api/coach/plans"));
    expect(response.status).toBe(403);
  });

  it("returns paginated plans for coaches", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });
    mockListCoachPlans.mockResolvedValue({
      items: [
        {
          id: "p1",
          title: "Strength Block",
          weekCount: 4,
          daysPerWeek: 3,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 4,
      hasMore: false,
    });

    const response = await GET(
      new Request("http://localhost/api/coach/plans?q=strength&limit=4"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ id: "p1", title: "Strength Block" }],
      total: 1,
      limit: 4,
    });
    expect(mockListCoachPlans).toHaveBeenCalledWith("coach-1", {
      q: "strength",
      page: 1,
      limit: 4,
    });
  });
});
