import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeDay } from "@/lib/plans/__tests__/fixtures";
import { PlanStructureControls } from "@/components/plan/plan-structure-controls";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "3.1.0",
    name: "Test Plan",
    weeks: [{ days: [makeDay({ code: "w1d1" }), makeDay({ code: "w1d2" })] }],
  };
}

describe("PlanStructureControls", () => {
  it("keeps mobile action buttons content-sized in horizontal rows", () => {
    render(
      <PlanStructureControls
        plan={makePlan()}
        selectedWeekPos={0}
        selectedDayPos={0}
        disabled={false}
        layout="mobile"
        onPlanChange={vi.fn()}
        onSelectionChange={vi.fn()}
      />,
    );

    for (const name of ["Add week", "Add day", "Delete week", "Delete day"]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).not.toContain("w-full");
    }
  });
});
