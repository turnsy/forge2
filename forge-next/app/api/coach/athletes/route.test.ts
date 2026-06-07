import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiRole = vi.fn();
const mockListCoachAthletes = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/athletes/repository", () => ({
  listCoachAthletes: (...args: unknown[]) => mockListCoachAthletes(...args),
}));

import { GET } from "@/app/api/coach/athletes/route";

describe("GET /api/coach/athletes", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockListCoachAthletes.mockReset();
    mockListCoachAthletes.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    });

    const response = await GET(new Request("http://localhost/api/coach/athletes"));
    expect(response.status).toBe(401);
  });

  it("returns paginated athletes for coaches", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });
    mockListCoachAthletes.mockResolvedValue({
      items: [{ id: "a1", name: "Alex", email: "", currentPlanId: null, currentPlanName: null, joinedAt: "" }],
      total: 1,
      page: 2,
      limit: 10,
      hasMore: false,
    });

    const response = await GET(
      new Request("http://localhost/api/coach/athletes?q=alex&page=2&limit=10"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [{ id: "a1", name: "Alex", email: "", currentPlanId: null, currentPlanName: null, joinedAt: "" }],
      total: 1,
      page: 2,
      limit: 10,
      hasMore: false,
    });
    expect(mockListCoachAthletes).toHaveBeenCalledWith({
      q: "alex",
      page: 2,
      limit: 10,
    });
  });
});
