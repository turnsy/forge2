import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAuthUser = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

import { requireApiRole } from "@/lib/auth/api";

describe("requireApiRole", () => {
  beforeEach(() => {
    mockGetAuthUser.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const result = await requireApiRole("coach");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 403 when role mismatches", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "u1",
      role: "athlete",
      email: "a@example.com",
      fullName: null,
    });
    const result = await requireApiRole("coach");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns the coach user when authorized", async () => {
    const user = {
      id: "coach-1",
      role: "coach" as const,
      email: "c@example.com",
      fullName: "Coach",
    };
    mockGetAuthUser.mockResolvedValue(user);
    const result = await requireApiRole("coach");
    expect(result).toEqual({ ok: true, user });
  });
});
