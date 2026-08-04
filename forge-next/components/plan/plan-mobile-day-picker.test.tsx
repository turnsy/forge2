import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeBlock, makeDay, makeExercise } from "@/lib/plans/__tests__/fixtures";
import { PlanMobileDayPicker } from "@/components/plan/plan-mobile-day-picker";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "3.1.0",
    name: "Strength Block",
    weeks: [
      {
        days: [
          makeDay({
            code: "w1d1",
            blocks: [
              makeBlock({
                id: "w1d1-b1",
                exercises: [makeExercise({ id: "w1d1-ex1", name: "Week 1 Day 1 Exercise", sets: [] })],
              }),
            ],
          }),
          makeDay({
            code: "w1d2",
            blocks: [
              makeBlock({
                id: "w1d2-b1",
                exercises: [makeExercise({ id: "w1d2-ex1", name: "Week 1 Day 2 Exercise", sets: [] })],
              }),
            ],
          }),
        ],
      },
      {
        label: "Deload Week",
        days: [
          makeDay({
            code: "w2d1",
            blocks: [
              makeBlock({
                id: "w2d1-b1",
                exercises: [makeExercise({ id: "w2d1-ex1", name: "Week 2 Day 1 Exercise", sets: [] })],
              }),
            ],
          }),
        ],
      },
    ],
  };
}

describe("PlanMobileDayPicker", () => {
  it("renders the collapsed header with a down chevron", () => {
    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekPos={0}
        selectedDayPos={0}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Week 1, Day 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week 1, Day 1" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("navigates to the previous day from the header arrow", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekPos={0}
        selectedDayPos={1}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Previous day" }));
    expect(onSelect).toHaveBeenCalledWith({ weekPos: 0, dayPos: 0 });
  });

  it("navigates to the next day from the header arrow", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekPos={0}
        selectedDayPos={0}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next day" }));
    expect(onSelect).toHaveBeenCalledWith({ weekPos: 0, dayPos: 1 });
  });

  it("opens a dropdown with every week and day, then selects on tap", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekPos={0}
        selectedDayPos={0}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Week 1, Day 1" }));

    expect(screen.getByRole("listbox", { name: "Plan days" })).toBeInTheDocument();
    const weekOne = screen.getByLabelText("Week 1");
    expect(screen.getByLabelText("Deload Week")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(within(weekOne).getByRole("option", { name: "Day 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(within(weekOne).getByRole("option", { name: "Day 2" }));

    expect(onSelect).toHaveBeenCalledWith({ weekPos: 0, dayPos: 1 });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("can select a day from a later week", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekPos={0}
        selectedDayPos={0}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Week 1, Day 1" }));

    const deloadWeek = screen.getByLabelText("Deload Week");
    await user.click(within(deloadWeek).getByRole("option", { name: "Day 1" }));

    expect(onSelect).toHaveBeenCalledWith({ weekPos: 1, dayPos: 0 });
  });
});
