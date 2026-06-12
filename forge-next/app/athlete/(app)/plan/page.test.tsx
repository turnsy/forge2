import { describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

import AthletePlanRedirectPage from "@/app/athlete/(app)/plan/page";

describe("AthletePlanRedirectPage", () => {
  it("redirects legacy plan URLs to athlete home", () => {
    expect(() => AthletePlanRedirectPage()).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/athlete");
  });
});
