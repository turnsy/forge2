import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanSetTable } from "@/components/plan/plan-set-table";
import type { Set } from "@/lib/plans/workout-plan";

function makeSet(overrides: Partial<Set> = {}): Set {
  return {
    id: "set-1",
    planned: {
      type: "exact",
      reps: 5,
      load: { type: "absolute", value: 100, unit: "kg" },
    },
    actual: null,
    status: "planned",
    locked: false,
    ...overrides,
  };
}

describe("PlanSetTable", () => {
  it("shows athlete actuals and completion indicator in coach view", () => {
    render(
      <PlanSetTable
        view="coach"
        sets={[
          makeSet({
            actual: {
              reps: 5,
              load: { type: "absolute", value: 102, unit: "kg" },
            },
            status: "completed",
          }),
          makeSet({
            id: "set-2",
            status: "skipped",
          }),
        ]}
      />,
    );

    expect(screen.getByText(/Actual: 5 reps · 102 kg/)).toBeInTheDocument();
    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
  });

  it("renders nothing for athlete view", () => {
    const { container } = render(
      <PlanSetTable view="athlete" sets={[makeSet()]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
