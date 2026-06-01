import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanViewer } from "@/components/plan/plan-viewer";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlanWithIdenticalSets(setCount: number): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Strength Block",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Hang SN",
                sets: Array.from({ length: setCount }, (_, index) => ({
                  id: `w1d1-hang-sn-${index + 1}`,
                  planned: {
                    type: "exact" as const,
                    reps: 3,
                    load: {
                      type: "percentage" as const,
                      unit: "%" as const,
                      basis: "snatch_1rm",
                      operator: "exact" as const,
                      value: 70,
                    },
                  },
                  actual: null,
                  status: "planned" as const,
                  locked: false,
                })),
              },
              {
                name: "Press",
                sets: [
                  {
                    id: "w1d1-press-1",
                    planned: {
                      type: "target" as const,
                      instruction: "work up to",
                      reps: 5,
                      notes: "work up to 3x5",
                    },
                    actual: null,
                    status: "planned" as const,
                    locked: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("PlanViewer", () => {
  it("renders one table row per set in coach view", () => {
    render(<PlanViewer plan={makePlanWithIdenticalSets(3)} view="coach" />);

    expect(screen.getByText("Hang SN")).toBeInTheDocument();
    expect(screen.getByText("Press")).toBeInTheDocument();

    const setCells = screen.getAllByRole("cell", { name: "3" });
    expect(setCells.length).toBeGreaterThanOrEqual(3);

    const rows = screen.getAllByRole("row");
    const dataRows = rows.filter((row) => row.querySelector("td"));
    expect(dataRows).toHaveLength(4);

    expect(screen.queryByText("planned")).not.toBeInTheDocument();
    expect(screen.queryByText("completed")).not.toBeInTheDocument();
  });

  it("renders week accordion open by default", () => {
    render(<PlanViewer plan={makePlanWithIdenticalSets(1)} view="coach" />);

    const weekAccordion = screen.getByText("Week 1").closest("details");
    expect(weekAccordion).toHaveAttribute("open");
  });
});
