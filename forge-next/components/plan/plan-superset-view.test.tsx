import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanSupersetView } from "@/components/plan/plan-superset-view";
import { makeBlock, makeExercise, makeSet } from "@/lib/plans/__tests__/fixtures";

function makeSupersetBlock() {
  return makeBlock({
    id: "ss-1",
    exercises: [
      makeExercise({
        id: "curl",
        name: "Curl",
        sets: [
          makeSet({ id: "curl-1", planned: { type: "exact", reps: 12, target: { type: "absolute", value: 20, unit: "kg" } } }),
          makeSet({ id: "curl-2", planned: { type: "exact", reps: 10, target: { type: "absolute", value: 22, unit: "kg" } } }),
        ],
      }),
      makeExercise({
        id: "extension",
        name: "Tricep extension",
        sets: [
          makeSet({ id: "ext-1", planned: { type: "exact", reps: 12, target: { type: "absolute", value: 15, unit: "kg" } } }),
          makeSet({ id: "ext-2", planned: { type: "exact", reps: 10, target: { type: "absolute", value: 17, unit: "kg" } } }),
        ],
      }),
    ],
  });
}

describe("PlanSupersetView", () => {
  it("renders coach view as round cards with exercise rows", () => {
    render(<PlanSupersetView block={makeSupersetBlock()} view="coach" />);

    expect(screen.getByText("Superset")).toBeInTheDocument();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
    expect(screen.getByText("Round 2")).toBeInTheDocument();
    expect(screen.getAllByText("Curl")).toHaveLength(2);
    expect(screen.getAllByText("Tricep extension")).toHaveLength(2);
    expect(screen.getByText("20 kg")).toBeInTheDocument();
    expect(screen.getByText("15 kg")).toBeInTheDocument();
  });

  it("renders athlete read-only view as round cards with exercise set rows", () => {
    render(<PlanSupersetView block={makeSupersetBlock()} view="athlete" />);

    expect(screen.getByText("Superset")).toBeInTheDocument();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
    expect(screen.getByText("Round 2")).toBeInTheDocument();
    expect(screen.getAllByText("Curl")).toHaveLength(2);
    expect(screen.getAllByLabelText("Set reps")).toHaveLength(4);
    expect(screen.getAllByLabelText("Set target")).toHaveLength(4);
  });
});
