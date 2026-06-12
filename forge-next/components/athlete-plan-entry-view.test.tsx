import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AthletePlanEntryView } from "@/components/athlete-plan-entry-view";
import type { CurrentDayLocation } from "@/lib/athlete/plan/domain";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const mockSaveSetActualsAction = vi.fn();
const mockCompleteDayAction = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/lib/athlete/plan/actions", () => ({
  saveSetActualsAction: (...args: unknown[]) => mockSaveSetActualsAction(...args),
  completeDayAction: (...args: unknown[]) => mockCompleteDayAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Strength Block",
    weeks: [
      {
        index: 1,
        label: "Week 1",
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Back Squat",
                sets: [
                  {
                    id: "w1d1-bs-1",
                    planned: {
                      type: "exact",
                      reps: 8,
                      load: { type: "absolute", value: 60, unit: "kg" },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                  {
                    id: "w1d1-bs-2",
                    planned: {
                      type: "exact",
                      reps: 6,
                      load: {
                        type: "percentage",
                        unit: "%",
                        operator: "exact",
                        value: 75,
                      },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
              {
                name: "Conditioning",
                sets: [
                  {
                    id: "w1d1-run-1",
                    planned: {
                      type: "target",
                      instruction: "Run 400m at RPE 7",
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

function makeCurrentDay(plan: WorkoutPlan): CurrentDayLocation {
  const week = plan.weeks[0];
  const day = week.days[0];

  return {
    weekIndex: week.index,
    dayIndex: day.index,
    week,
    day,
  };
}

describe("AthletePlanEntryView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockSaveSetActualsAction.mockResolvedValue(undefined);
    mockCompleteDayAction.mockResolvedValue({ nextDayIdx: null, allDaysDone: false });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders plan header and set input variants", () => {
    const plan = makePlan();
    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    expect(screen.getByRole("heading", { name: "Strength Block" })).toBeInTheDocument();
    expect(screen.getByText("Week 1 · Day 1")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText("Run 400m at RPE 7")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("8")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("60")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("75%")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("debounces auto-save instead of saving on every keystroke", async () => {
    vi.useFakeTimers();
    const plan = makePlan();
    mockSaveSetActualsAction.mockResolvedValue(undefined);

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "87" } });
    expect(mockSaveSetActualsAction).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(800);
    expect(mockSaveSetActualsAction).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("shows save error when auto-save fails", async () => {
    mockSaveSetActualsAction.mockRejectedValue(new Error("save failed"));

    const plan = makePlan();
    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });

    await waitFor(
      () => {
        expect(screen.getByText("Save failed")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("completes the day directly when all non-target sets are filled", async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    mockCompleteDayAction.mockResolvedValue({ nextDayIdx: 2, allDaysDone: false });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("60"), { target: { value: "60" } });
    fireEvent.change(screen.getByPlaceholderText("6"), { target: { value: "6" } });
    fireEvent.change(screen.getByPlaceholderText("75%"), { target: { value: "75" } });

    await user.click(screen.getByRole("button", { name: "Complete Day" }));

    await waitFor(() => {
      expect(mockCompleteDayAction).toHaveBeenCalledWith("assignment-1", 1, 1);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("opens skip dialog when completing with unfilled sets", async () => {
    const user = userEvent.setup();
    const plan = makePlan();

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Complete Day" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mockCompleteDayAction).not.toHaveBeenCalled();
  });

  it("confirms skip and completes the day", async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    mockCompleteDayAction.mockResolvedValue({ nextDayIdx: 2, allDaysDone: false });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Complete Day" }));
    await user.click(screen.getByRole("button", { name: "Skip & Complete" }));

    await waitFor(() => {
      expect(mockCompleteDayAction).toHaveBeenCalledWith("assignment-1", 1, 1);
    });
  });

  it("renders celebration when all days are done", async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    mockCompleteDayAction.mockResolvedValue({ nextDayIdx: null, allDaysDone: true });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("60"), { target: { value: "60" } });
    fireEvent.change(screen.getByPlaceholderText("6"), { target: { value: "6" } });
    fireEvent.change(screen.getByPlaceholderText("75%"), { target: { value: "75" } });
    await user.click(screen.getByRole("button", { name: "Complete Day" }));

    await waitFor(() => {
      expect(screen.getByText("All workouts complete! 🎉")).toBeInTheDocument();
    });
  });

  it("keeps local input values when parent props refresh for the same day", async () => {
    vi.useFakeTimers();
    const plan = makePlan();
    mockSaveSetActualsAction.mockResolvedValue(undefined);

    const { rerender } = render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    await vi.advanceTimersByTimeAsync(800);

    const refreshedPlan = structuredClone(plan);
    refreshedPlan.weeks[0].days[0].exercises[0].sets[0].actual = { reps: 8 };

    rerender(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={refreshedPlan}
        currentDay={makeCurrentDay(refreshedPlan)}
        coachName="Coach Alex"
      />,
    );

    expect(screen.getByPlaceholderText("8")).toHaveValue("8");
    vi.useRealTimers();
  });

  it("scrolls to the first incomplete set on mount", () => {
    const plan = makePlan();
    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        currentDay={makeCurrentDay(plan)}
        coachName="Coach Alex"
      />,
    );

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });
});
