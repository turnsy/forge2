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
  it("shows inline status pills and parenthesized actual values in coach view", () => {
    const { container } = render(
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

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
    expect(screen.getByText("(5)")).toBeInTheDocument();
    expect(screen.getByText("(102 kg)")).toBeInTheDocument();
    expect(screen.queryByText(/Actual:/)).not.toBeInTheDocument();

    const matchingReps = screen.getByText("(5)");
    const mismatchedLoad = screen.getByText("(102 kg)");

    expect(matchingReps).toHaveClass("text-emerald-700");
    expect(mismatchedLoad).toHaveClass("text-amber-800");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  });

  it("uses mobile-friendly layout classes for set rows", () => {
    const { container } = render(
      <PlanSetTable
        view="coach"
        sets={[
          makeSet({
            actual: {
              reps: 5,
              load: { type: "absolute", value: 85, unit: "kg" },
            },
            status: "completed",
          }),
        ]}
      />,
    );

    const setNumber = container.querySelector("tbody tr td:first-child span");
    expect(setNumber).toHaveClass("hidden", "md:inline");

    const repsCell = screen.getByText("(5)").parentElement;
    expect(repsCell).toHaveClass("flex", "flex-col", "md:inline-flex");

    const statusPill = screen.getByText("Completed");
    expect(statusPill).toHaveClass("text-[10px]", "md:text-xs");
  });

  it("shows percentage-based actual load in green", () => {
    render(
      <PlanSetTable
        view="coach"
        sets={[
          makeSet({
            planned: {
              type: "exact",
              reps: 5,
              load: {
                type: "percentage",
                unit: "%",
                basis: "back_squat_1rm",
                operator: "exact",
                value: 80,
              },
            },
            actual: {
              reps: 5,
              load: { type: "absolute", value: 102, unit: "kg" },
            },
            status: "completed",
          }),
        ]}
      />,
    );

    expect(screen.getByText("(102 kg)")).toHaveClass("text-emerald-700");
  });

  it("renders nothing for athlete view", () => {
    const { container } = render(
      <PlanSetTable view="athlete" sets={[makeSet()]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
