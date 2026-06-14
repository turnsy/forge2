import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAuthUser = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

import { requireRoleAuth } from "@/lib/errors/require-role-auth";

describe("requireRoleAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated user when the role matches", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "athlete-1",
      role: "athlete",
      email: "athlete@example.com",
      fullName: "Athlete One",
    });

    await expect(requireRoleAuth("athlete")).resolves.toEqual({
      ok: true,
      user: {
        id: "athlete-1",
        role: "athlete",
        email: "athlete@example.com",
        fullName: "Athlete One",
      },
    });
  });

  it("returns unauthorized when no user is signed in", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    await expect(requireRoleAuth("athlete")).resolves.toEqual({
      ok: false,
      code: "unauthorized",
      message: "Not authenticated",
    });
  });

  it("returns unauthorized when the role does not match", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "coach-1",
      role: "coach",
      email: "coach@example.com",
      fullName: "Coach Alex",
    });

    await expect(requireRoleAuth("athlete")).resolves.toEqual({
      ok: false,
      code: "unauthorized",
      message: "Access denied",
    });
  });
});
