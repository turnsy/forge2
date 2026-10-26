import { afterEach, describe, expect, it, vi } from "vitest";

describe("getRequestOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("next/headers");
  });

  it("prefers configured site URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://forge.example.com/");
    vi.stubEnv("VERCEL_URL", "forge-preview.vercel.app");
    vi.doMock("next/headers", () => ({
      headers: vi.fn(async () => ({ get: () => null })),
    }));

    const { getRequestOrigin } = await import("@/lib/auth/origin");
    await expect(getRequestOrigin()).resolves.toBe("https://forge.example.com");
  });

  it("uses x-forwarded host headers when present", async () => {
    vi.doMock("next/headers", () => ({
      headers: vi.fn(async () => ({
        get: (name: string) => {
          if (name === "x-forwarded-host") return "app.example.com";
          if (name === "x-forwarded-proto") return "https";
          return null;
        },
      })),
    }));

    const { getRequestOrigin } = await import("@/lib/auth/origin");
    await expect(getRequestOrigin()).resolves.toBe("https://app.example.com");
  });

  it("falls back to VERCEL_URL when headers are missing", async () => {
    vi.stubEnv("VERCEL_URL", "forge-next.vercel.app");
    vi.doMock("next/headers", () => ({
      headers: vi.fn(async () => ({ get: () => null })),
    }));

    const { getRequestOrigin } = await import("@/lib/auth/origin");
    await expect(getRequestOrigin()).resolves.toBe(
      "https://forge-next.vercel.app",
    );
  });

  it("falls back to localhost in local dev", async () => {
    vi.doMock("next/headers", () => ({
      headers: vi.fn(async () => ({ get: () => null })),
    }));

    const { getRequestOrigin } = await import("@/lib/auth/origin");
    await expect(getRequestOrigin()).resolves.toBe("http://localhost:3000");
  });
});
