import { beforeEach, describe, expect, it, vi } from "vitest";
import { SIGNUP_ROLE_COOKIE } from "@/lib/auth/types";

const cookieGet = vi.fn();
const cookieDelete = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookieGet,
    delete: cookieDelete,
  })),
}));

import {
  consumeSignupRoleCookie,
  readSignupRoleCookie,
  requireSignupRoleCookie,
} from "@/lib/auth/signup-cookies";

describe("signup role cookie helpers", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    cookieDelete.mockReset();
  });

  it("reads a valid signup role cookie", async () => {
    cookieGet.mockReturnValue({ value: "coach" });

    await expect(readSignupRoleCookie()).resolves.toBe("coach");
    expect(cookieGet).toHaveBeenCalledWith(SIGNUP_ROLE_COOKIE);
  });

  it("ignores invalid cookie values", async () => {
    cookieGet.mockReturnValue({ value: "admin" });

    await expect(readSignupRoleCookie()).resolves.toBeNull();
  });

  it("requires the same cookie value as read", async () => {
    cookieGet.mockReturnValue({ value: "athlete" });

    await expect(requireSignupRoleCookie()).resolves.toBe("athlete");
  });

  it("consumes and deletes a valid cookie", async () => {
    cookieGet.mockReturnValue({ value: "coach" });

    await expect(consumeSignupRoleCookie()).resolves.toBe("coach");
    expect(cookieDelete).toHaveBeenCalledWith(SIGNUP_ROLE_COOKIE);
  });

  it("does not delete a missing cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    await expect(consumeSignupRoleCookie()).resolves.toBeNull();
    expect(cookieDelete).not.toHaveBeenCalled();
  });
});
