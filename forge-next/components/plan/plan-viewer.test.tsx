import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeBlock, makeDay, makeExercise } from "@/lib/plans/__tests__/fixtures";
import { PlanViewer } from "@/components/plan/plan-viewer";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

function makePlanWithIdenticalSets(setCount: number): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name: "Strength Block",
    weeks: [
      {
        days: [
          makeDay({
            code: "w1d1",
            blocks: [
              makeBlock({
                id: "w1d1-b1",
                exercises: [
                  makeExercise({
                    id: "hang-sn",
                    name: "Hang SN",
                    sets: Array.from({ length: setCount }, (_, index) => ({
                      id: `w1d1-hang-sn-${index + 1}`,
                      planned: {
                        type: "exact" as const,
                        reps: 3,
                        load: {
                          type: "percentage" as const,
                          value: 70,
                          unit: "kg",
                        },
                      },
                      actual: null,
                      status: "planned" as const,
                      locked: false,
                    })),
                  }),
                  makeExercise({
                    id: "press",
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
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  };
}

describe("PlanViewer", () => {
  it("renders one table row per set in coach view via PlanDayNavigator", () => {
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

  it("renders day navigation dropdowns", () => {
    render(<PlanViewer plan={makePlanWithIdenticalSets(1)} view="coach" />);

    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toHaveTextContent("Day 1");
    expect(screen.queryByText("w1d1")).not.toBeInTheDocument();
  });

  it("can hide the meta summary", () => {
    render(<PlanViewer plan={makePlanWithIdenticalSets(1)} view="coach" showMeta={false} />);

    expect(screen.queryByText("Weeks")).not.toBeInTheDocument();
    expect(screen.queryByText("Days/week")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Week")).toBeInTheDocument();
  });
});
