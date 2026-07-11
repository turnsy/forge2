import { describe, expect, it } from "vitest";
import { getRunStatusLabel } from "@/lib/chat/run-status-copy";

describe("run status copy", () => {
  it("maps run statuses to labels", () => {
    expect(getRunStatusLabel("sandbox")).toBe("Running builder");
    expect(getRunStatusLabel("validating")).toBe("Validating");
  });
});
