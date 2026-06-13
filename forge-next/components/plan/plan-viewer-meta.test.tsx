import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanViewerMeta } from "@/components/plan/plan-viewer-meta";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

describe("PlanViewerMeta", () => {
  it("renders weeks and days per week in a horizontal row", () => {
    render(<PlanViewerMeta plan={minimalWorkoutPlan} layout="row" showDiscipline={false} />);

    expect(screen.getByText("Weeks")).toBeInTheDocument();
    expect(screen.getByText("Days/week")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.queryByText("Discipline")).not.toBeInTheDocument();
  });
});
