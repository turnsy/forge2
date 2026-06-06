import { describe, expect, it } from "vitest";
import { escapeIlikePattern } from "@/lib/lists/escape-ilike";

describe("escapeIlikePattern", () => {
  it("escapes ilike wildcard characters", () => {
    expect(escapeIlikePattern("100%_done")).toBe("100\\%\\_done");
  });
});
