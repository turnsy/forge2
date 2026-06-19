import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CoachEditableDayView } from "@/components/plan/coach-editable-day-view";
import { reorderSetsInExercise } from "@/components/plan/plan-editable-day";
import type { Set, WorkoutPlan } from "@/lib/plans/workout-plan";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

function makeSet(id: string, reps: number, weight: number): Set {
  return {
    id,
    planned: {
      type: "exact",
      reps,
      load: { type: "absolute", value: weight, unit: "lb" },
    },
    actual: null,
    status: "planned",
    locked: false,
  };
}

function makePercentagePlan(): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Percentage Block",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            name: "Squat Day",
            exercises: [
              {
                name: "Back Squat",
                sets: [
                  {
                    id: "set-pct-1",
                    planned: {
                      type: "exact",
                      reps: 5,
                      load: {
                        type: "percentage",
                        unit: "%",
                        operator: "exact",
                        value: 75,
                        basis: "back_squat_1rm",
                      },
                    },
                    actual: null,
                    status: "planned",
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

function makePlan(): WorkoutPlan {
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
            name: "Upper Body",
            exercises: [
              {
                name: "Bench Press",
                sets: [
                  makeSet("set-1", 12, 185),
                  makeSet("set-2", 10, 205),
                ],
              },
              {
                name: "Pull Ups",
                sets: [makeSet("set-3", 8, 0)],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("CoachEditableDayView", () => {
  it("renders exercise names as inputs", () => {
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Bench Press")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pull Ups")).toBeInTheDocument();
  });

  it("shows day index as placeholder and allows clearing the day name", () => {
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    const dayNameInput = screen.getByLabelText("Day name");
    expect(dayNameInput).toHaveDisplayValue("Upper Body");
    expect(dayNameInput).toHaveAttribute("placeholder", "Day 1");

    fireEvent.change(dayNameInput, { target: { value: "" } });

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(lastCall.weeks[0].days[0].name).toBeUndefined();
  });

  it("keeps the day name input empty after clearing when the plan updates", () => {
    function Harness() {
      const [plan, setPlan] = useState(makePlan());

      return (
        <CoachEditableDayView
          plan={plan}
          weekIndex={1}
          dayIndex={1}
          disabled={false}
          onPlanChange={setPlan}
        />
      );
    }

    render(<Harness />);

    const dayNameInput = screen.getByLabelText("Day name");
    fireEvent.change(dayNameInput, { target: { value: "" } });

    expect(dayNameInput).toHaveDisplayValue("");
    expect(dayNameInput).toHaveAttribute("placeholder", "Day 1");
  });

  it("uses day index placeholder when the day has no name", () => {
    const plan = makePlan();
    plan.weeks[0].days[0].name = undefined;

    render(
      <CoachEditableDayView
        plan={plan}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={vi.fn()}
      />,
    );

    const dayNameInput = screen.getByLabelText("Day name");
    expect(dayNameInput).toHaveDisplayValue("");
    expect(dayNameInput).toHaveAttribute("placeholder", "Day 1");
  });

  it("changing exercise name calls onPlanChange with the updated plan", () => {
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    const nameInput = screen.getByDisplayValue("Bench Press");
    fireEvent.change(nameInput, { target: { value: "Incline Bench" } });

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(lastCall.weeks[0].days[0].exercises[0].name).toBe("Incline Bench");
  });

  it("changing set reps calls onPlanChange", () => {
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    const repsInput = screen.getAllByLabelText("Set 1 reps")[0];
    fireEvent.change(repsInput, { target: { value: "15" } });

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(lastCall.weeks[0].days[0].exercises[0].sets[0].planned).toMatchObject({
      reps: 15,
    });
  });

  it("changing set weight calls onPlanChange", () => {
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    const weightInput = screen.getAllByLabelText("Set 1 target")[0];
    fireEvent.change(weightInput, { target: { value: "195" } });

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    const load = lastCall.weeks[0].days[0].exercises[0].sets[0].planned;
    expect(load.type).toBe("exact");
    if (load.type === "exact") {
      expect(load.load).toMatchObject({ value: 195 });
    }
  });

  it("renders drag handles for set rows", () => {
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getAllByLabelText("Drag to reorder set").length).toBeGreaterThan(0);
  });

  it("reorders sets within an exercise", () => {
    const sets = [makeSet("set-1", 12, 185), makeSet("set-2", 10, 205)];
    const reordered = reorderSetsInExercise(sets, "set-2", "set-1");
    expect(reordered.map((set) => set.id)).toEqual(["set-2", "set-1"]);
  });

  it("adds a new set pre-filled from the previous set", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    const addSetButtons = screen.getAllByRole("button", { name: "Add set" });
    await user.click(addSetButtons[0]);

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    const sets = lastCall.weeks[0].days[0].exercises[0].sets;
    expect(sets).toHaveLength(3);
    expect(sets[2].planned).toMatchObject({
      reps: 10,
      load: { type: "absolute", value: 205, unit: "lb" },
    });
  });

  it("removes a set when delete is clicked", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    await user.click(screen.getByLabelText("Delete set 1"));

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(lastCall.weeks[0].days[0].exercises[0].sets).toHaveLength(1);
  });

  it("adds a new exercise", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add exercise" }));

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(lastCall.weeks[0].days[0].exercises).toHaveLength(3);
    expect(lastCall.weeks[0].days[0].exercises[2].name).toBe("New Exercise");
    expect(lastCall.weeks[0].days[0].exercises[2].id).toBeTruthy();
  });

  it("assigns stable ids to exercises without one", () => {
    const plan = makePlan();
    delete plan.weeks[0].days[0].exercises[0].id;

    let currentPlan = plan;
    const onPlanChange = vi.fn((updated: WorkoutPlan) => {
      currentPlan = updated;
    });

    const { rerender } = render(
      <CoachEditableDayView
        plan={currentPlan}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Bench Press"), {
      target: { value: "Incline Bench" },
    });

    const exerciseId = currentPlan.weeks[0].days[0].exercises[0].id;
    expect(exerciseId).toBeTruthy();

    rerender(
      <CoachEditableDayView
        plan={currentPlan}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Incline Bench"), {
      target: { value: "Flat Bench" },
    });

    expect(currentPlan.weeks[0].days[0].exercises[0].id).toBe(exerciseId);
  });

  it("removes an exercise when delete is clicked", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    await user.click(screen.getAllByLabelText("Delete exercise")[0]);

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(lastCall.weeks[0].days[0].exercises).toHaveLength(1);
    expect(lastCall.weeks[0].days[0].exercises[0].name).toBe("Pull Ups");
  });

  it("swaps exercises with reorder buttons", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    await user.click(screen.getAllByLabelText("Move exercise down")[0]);

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(lastCall.weeks[0].days[0].exercises[0].name).toBe("Pull Ups");
    expect(lastCall.weeks[0].days[0].exercises[1].name).toBe("Bench Press");
  });

  it("allows entering a custom load unit", () => {
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    const unitSelect = screen.getAllByLabelText("Unit")[0];
    fireEvent.change(unitSelect, { target: { value: "__custom__" } });

    const customUnitInput = screen.getByLabelText("Custom unit");
    expect(customUnitInput).toBeInTheDocument();
    expect(customUnitInput).toHaveAttribute("placeholder", "e.g. mi");

    fireEvent.change(customUnitInput, { target: { value: "mi" } });

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    const load = lastCall.weeks[0].days[0].exercises[0].sets[0].planned;
    expect(load.type).toBe("exact");
    if (load.type === "exact" && load.load.type === "absolute") {
      expect(load.load.unit).toBe("mi");
    }
  });

  it("allows clearing a custom load unit while editing", () => {
    const onPlanChange = vi.fn();
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled={false}
        onPlanChange={onPlanChange}
      />,
    );

    const unitSelect = screen.getAllByLabelText("Unit")[0];
    fireEvent.change(unitSelect, { target: { value: "__custom__" } });

    const customUnitInput = screen.getByLabelText("Custom unit");
    fireEvent.change(customUnitInput, { target: { value: "mi" } });
    fireEvent.change(customUnitInput, { target: { value: "" } });

    expect(customUnitInput).toHaveValue("");

    const lastCall = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    const load = lastCall.weeks[0].days[0].exercises[0].sets[0].planned;
    expect(load.type).toBe("exact");
    if (load.type === "exact" && load.load.type === "absolute") {
      expect(load.load.unit).toBe("");
    }
  });

  it("toggles percentage load with the percent button", () => {
    function Harness() {
      const [plan, setPlan] = useState(makePlan());

      return (
        <CoachEditableDayView
          plan={plan}
          weekIndex={1}
          dayIndex={1}
          disabled={false}
          onPlanChange={setPlan}
        />
      );
    }

    render(<Harness />);

    const percentToggle = screen.getAllByLabelText("Use percentage load")[0];
    expect(percentToggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(percentToggle);

    expect(percentToggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByLabelText("Set 1 target")[0]).toHaveValue("100");
    expect(screen.getAllByLabelText("Unit")[0]).toHaveValue("lb");

    fireEvent.click(percentToggle);

    expect(percentToggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByLabelText("Set 1 target")[0]).toHaveValue("100");
    expect(screen.getAllByLabelText("Unit")[0]).toHaveValue("lb");
  });

  it("keeps the unit control visible for percentage sets", () => {
    function Harness() {
      const [plan, setPlan] = useState(makePercentagePlan());

      return (
        <CoachEditableDayView
          plan={plan}
          weekIndex={1}
          dayIndex={1}
          disabled={false}
          onPlanChange={setPlan}
        />
      );
    }

    render(<Harness />);

    expect(screen.getAllByLabelText("Use percentage load")[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByLabelText("Set 1 target")[0]).toHaveValue("75");
    expect(screen.getAllByLabelText("Unit")[0]).toHaveValue("lb");
    expect(screen.queryByLabelText("Percentage basis")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Percentage operator")).not.toBeInTheDocument();
  });

  it("persists the selected unit on percentage loads", () => {
    function Harness() {
      const [plan, setPlan] = useState(makePercentagePlan());

      return (
        <CoachEditableDayView
          plan={plan}
          weekIndex={1}
          dayIndex={1}
          disabled={false}
          onPlanChange={setPlan}
        />
      );
    }

    render(<Harness />);

    fireEvent.change(screen.getAllByLabelText("Unit")[0], { target: { value: "kg" } });

    const load = screen.getAllByLabelText("Set 1 target")[0];
    fireEvent.change(load, { target: { value: "80" } });

    const unitSelect = screen.getAllByLabelText("Unit")[0];
    expect(unitSelect).toHaveValue("kg");

    fireEvent.click(screen.getAllByLabelText("Use percentage load")[0]);
    fireEvent.click(screen.getAllByLabelText("Use percentage load")[0]);

    expect(screen.getAllByLabelText("Unit")[0]).toHaveValue("kg");
  });

  it("disables inputs and buttons when disabled", () => {
    render(
      <CoachEditableDayView
        plan={makePlan()}
        weekIndex={1}
        dayIndex={1}
        disabled
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Bench Press")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Add exercise" })).toBeDisabled();
    expect(screen.getAllByLabelText("Drag to reorder set")[0]).toBeDisabled();
    expect(document.querySelector("[data-plan-editable-day]")).toHaveClass(
      "pointer-events-none",
    );
  });
});
