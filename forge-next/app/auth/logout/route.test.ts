import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAuthUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

import { POST } from "@/app/auth/logout/route";

describe("logout route", () => {
  beforeEach(() => {
    mockGetAuthUser.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
  });

  it("redirects coach users to home with coach role", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "user-1",
      role: "coach",
      email: "coach@example.com",
      fullName: "Coach",
    });

    const response = await POST(
      new Request("http://localhost:3000/auth/logout", { method: "POST" }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/?role=coach",
    );
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("redirects athlete users to home with athlete role", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "user-2",
      role: "athlete",
      email: "athlete@example.com",
      fullName: "Athlete",
    });

    const response = await POST(
      new Request("http://localhost:3000/auth/logout", { method: "POST" }),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/?role=athlete",
    );
  });

  it("redirects to bare home when role is unknown", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/auth/logout", { method: "POST" }),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });
});
