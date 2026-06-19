import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));

import {
  updateProfileEmail,
  updateProfileFullName,
} from "@/lib/profile/repository";

describe("profile repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("updates profile full name", async () => {
    const result = await updateProfileFullName("user-1", "Alex Rivera");

    expect(result).toEqual({ ok: true });
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockEq).toHaveBeenCalledWith("id", "user-1");
  });

  it("rejects empty profile names", async () => {
    const result = await updateProfileFullName("user-1", "   ");

    expect(result).toEqual({
      ok: false,
      code: "validation_error",
      message: "Name is required",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("updates auth email", async () => {
    const result = await updateProfileEmail("new@example.com");

    expect(result).toEqual({ ok: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({ email: "new@example.com" });
  });

  it("rejects empty email", async () => {
    const result = await updateProfileEmail(" ");

    expect(result).toEqual({
      ok: false,
      code: "validation_error",
      message: "Email is required",
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
