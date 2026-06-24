import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanSupersetView } from "@/components/plan/plan-superset-view";
import { makeSupersetBlock } from "@/lib/plans/__tests__/fixtures";

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
