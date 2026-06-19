import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRoleAuth = vi.fn();
const mockUpdateProfileFullName = vi.fn();
const mockUpdateProfileEmail = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/errors/require-role-auth", () => ({
  requireRoleAuth: (...args: unknown[]) => mockRequireRoleAuth(...args),
}));

vi.mock("@/lib/profile/repository", () => ({
  updateProfileFullName: (...args: unknown[]) => mockUpdateProfileFullName(...args),
  updateProfileEmail: (...args: unknown[]) => mockUpdateProfileEmail(...args),
}));

import {
  updateProfileEmailAction,
  updateProfileFullNameAction,
} from "@/lib/profile/actions";

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRoleAuth.mockResolvedValue({
      ok: true,
      user: {
        id: "athlete-1",
        role: "athlete",
        email: "athlete@example.com",
        fullName: "Athlete One",
      },
    });
    mockUpdateProfileFullName.mockResolvedValue({ ok: true });
    mockUpdateProfileEmail.mockResolvedValue({ ok: true });
  });

  it("updates full name for the authenticated athlete", async () => {
    const result = await updateProfileFullNameAction("Alex Rivera");

    expect(result).toEqual({ ok: true });
    expect(mockUpdateProfileFullName).toHaveBeenCalledWith("athlete-1", "Alex Rivera");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete/settings");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete", "layout");
  });

  it("returns auth errors from full name action", async () => {
    mockRequireRoleAuth.mockResolvedValue({
      ok: false,
      code: "unauthorized",
      message: "Not authenticated",
    });

    const result = await updateProfileFullNameAction("Alex Rivera");

    expect(result).toEqual({
      ok: false,
      code: "unauthorized",
      message: "Not authenticated",
    });
    expect(mockUpdateProfileFullName).not.toHaveBeenCalled();
  });

  it("updates email for the authenticated athlete", async () => {
    const result = await updateProfileEmailAction("new@example.com");

    expect(result).toEqual({ ok: true });
    expect(mockUpdateProfileEmail).toHaveBeenCalledWith("new@example.com");
  });

  it("rejects unchanged email addresses", async () => {
    const result = await updateProfileEmailAction("athlete@example.com");

    expect(result).toEqual({
      ok: false,
      code: "validation_error",
      message: "Enter a different email address",
    });
    expect(mockUpdateProfileEmail).not.toHaveBeenCalled();
  });
});
