import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanDayView } from "@/components/plan/plan-day-view";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const mockSaveSetActualsAction = vi.fn();
const mockCompleteDayAction = vi.fn();

vi.mock("@/lib/athlete/plan/actions", () => ({
  saveSetActualsAction: (...args: unknown[]) => mockSaveSetActualsAction(...args),
  completeDayAction: (...args: unknown[]) => mockCompleteDayAction(...args),
}));

function makePlan(overrides: {
  dayComplete?: boolean;
  includeSkippedSet?: boolean;
} = {}): WorkoutPlan {
  const sets: WorkoutPlan["weeks"][number]["days"][number]["exercises"][number]["sets"] = [
    {
      id: "w1d1-bs-1",
      planned: {
        type: "exact",
        reps: 8,
        load: { type: "absolute", value: 60, unit: "kg" },
      },
      actual: overrides.dayComplete
        ? { reps: 8, load: { type: "absolute", value: 60, unit: "kg" } }
        : null,
      status: overrides.dayComplete ? "completed" : "planned",
      locked: false,
    },
  ];

  if (overrides.includeSkippedSet) {
    sets.push({
      id: "w1d1-bs-2",
      planned: {
        type: "exact",
        reps: 5,
        load: { type: "absolute", value: 80, unit: "kg" },
      },
      actual: null,
      status: "skipped",
      locked: false,
    });
  }

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
                name: "Back Squat",
                sets,
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("PlanDayView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveSetActualsAction.mockResolvedValue({ ok: true });
    mockCompleteDayAction.mockResolvedValue({ ok: true, nextDayIdx: null, allDaysDone: false });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows PlanSetTable for coach view", () => {
    render(
      <PlanDayView plan={makePlan()} weekIndex={1} dayIndex={1} view="coach" />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });

  it("shows athlete read-only layout for completed day with status shading", () => {
    const { container } = render(
      <PlanDayView
        plan={makePlan({ dayComplete: true })}
        weekIndex={1}
        dayIndex={1}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("8")).not.toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("60 kg")).toBeInTheDocument();

    const completedRow = container.querySelector('[data-set-status="completed"]');
    expect(completedRow).toHaveClass("bg-orange-500/10");
  });

  it("shades skipped sets red in athlete read-only view", () => {
    const { container } = render(
      <PlanDayView
        plan={makePlan({ dayComplete: true, includeSkippedSet: true })}
        weekIndex={1}
        dayIndex={1}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByText("Skipped")).toBeInTheDocument();

    const skippedRow = container.querySelector('[data-set-status="skipped"]');
    expect(skippedRow).toHaveClass("bg-danger-muted/60");
  });

  it("shows set inputs for athlete editable view on incomplete day", () => {
    render(
      <PlanDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByPlaceholderText("8")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("60")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows Complete button for athlete editable view", () => {
    render(
      <PlanDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByRole("button", { name: "Complete" })).toBeInTheDocument();
  });

  it("hides Complete button for read-only views", () => {
    const { rerender } = render(
      <PlanDayView plan={makePlan()} weekIndex={1} dayIndex={1} view="coach" />,
    );

    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();

    rerender(
      <PlanDayView
        plan={makePlan({ dayComplete: true })}
        weekIndex={1}
        dayIndex={1}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
  });

  it("shows Day not found empty state for out-of-bounds indices", () => {
    render(
      <PlanDayView plan={makePlan()} weekIndex={99} dayIndex={99} view="coach" />,
    );

    expect(screen.getByText("Day not found")).toBeInTheDocument();
  });
});
