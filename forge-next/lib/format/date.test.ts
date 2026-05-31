import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format/date";

describe("formatDate", () => {
  it("formats an ISO date in a stable readable form", () => {
    expect(formatDate("2026-01-15T12:00:00.000Z")).toBe("Jan 15, 2026");
  });
});
