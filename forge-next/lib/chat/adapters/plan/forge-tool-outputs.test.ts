import { describe, expect, it } from "vitest";
import {
  isPlanArtifactToolSuccess,
  isSubmitPlanCodeOutput,
  isToolErrorsOutput,
} from "@/lib/chat/adapters/plan/forge-tool-outputs";

describe("forge-tool-outputs", () => {
  it("narrows submit_plan_code success and failure", () => {
    expect(
      isSubmitPlanCodeOutput({
        ok: true,
        plan: { name: "Plan", schemaVersion: "3.1.0", weeks: [] },
        title: "Plan",
      }),
    ).toBe(true);
    expect(
      isSubmitPlanCodeOutput({
        ok: false,
        errors: [{ code: "SANDBOX_FAILED", message: "boom" }],
      }),
    ).toBe(true);
    expect(isSubmitPlanCodeOutput({ ok: true })).toBe(false);
  });

  it("narrows artifact success outputs", () => {
    const plan = { name: "Plan", schemaVersion: "3.1.0", weeks: [] };
    expect(isPlanArtifactToolSuccess({ ok: true, plan, title: "Plan" })).toBe(
      true,
    );
    expect(isPlanArtifactToolSuccess({ ok: false, errors: [] })).toBe(false);
  });

  it("narrows tool error payloads", () => {
    expect(
      isToolErrorsOutput({
        ok: false,
        errors: [{ message: "failed" }],
      }),
    ).toBe(true);
    expect(isToolErrorsOutput({ ok: false, message: "failed" })).toBe(false);
  });
});
