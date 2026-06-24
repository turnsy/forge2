import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AthletePlanEntryView } from "@/components/athlete-plan-entry-view";
import { completeDayInPlan } from "@/lib/athlete/plan/domain";
import {
  makeBlock,
  makeDay,
  makeExercise,
  makeSet,
} from "@/lib/plans/__tests__/fixtures";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const mockSaveSetActualsAction = vi.fn();
const mockCompleteDayAction = vi.fn();
const mockUseIsMobile = vi.fn(() => false);

vi.mock("@/lib/athlete/plan/actions", () => ({
  saveSetActualsAction: (...args: unknown[]) => mockSaveSetActualsAction(...args),
  completeDayAction: (...args: unknown[]) => mockCompleteDayAction(...args),
}));

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name: "Strength Block",
    weeks: [
      {
        label: "Week 1",
        days: [
          makeDay({
            code: "w1d1",
            blocks: [
              makeBlock({
                id: "w1d1-b1",
                exercises: [
                  makeExercise({
                    id: "back-squat",
                    name: "Back Squat",
                    sets: [
                      makeSet({
                        id: "w1d1-bs-1",
                        planned: {
                          type: "exact",
                          reps: 8,
                          load: { type: "absolute", value: 60, unit: "kg" },
                        },
                      }),
                      makeSet({
                        id: "w1d1-bs-2",
                        planned: {
                          type: "exact",
                          reps: 6,
                          load: {
                            type: "percentage",
                            value: 75,
                            unit: "kg",
                          },
                        },
                      }),
                    ],
                  }),
                  makeExercise({
                    id: "conditioning",
                    name: "Conditioning",
                    sets: [
                      makeSet({
                        id: "w1d1-run-1",
                        planned: {
                          type: "target",
                          instruction: "Run 400m at RPE 7",
                        },
                      }),
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

function makeCompletedPlan(): WorkoutPlan {
  const plan = makePlan();
  const filled = {
    ...plan,
    weeks: plan.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        blocks: day.blocks.map((block) => ({
          ...block,
          exercises: block.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) => {
              if (set.planned.type === "target") {
                return set;
              }

              if (set.id === "w1d1-bs-1") {
                return {
                  ...set,
                  actual: {
                    reps: 8,
                    load: { type: "absolute" as const, value: 60, unit: "kg" as const },
                  },
                };
              }

              return {
                ...set,
                actual: {
                  reps: 6,
                  load: { type: "absolute" as const, value: 75, unit: "kg" as const },
                },
              };
            }),
          })),
        })),
      })),
    })),
  };

  return completeDayInPlan(filled, 0, 0).plan;
}

describe("AthletePlanEntryView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockUseIsMobile.mockReturnValue(false);
    mockSaveSetActualsAction.mockResolvedValue({ ok: true });
    mockCompleteDayAction.mockResolvedValue({
      ok: true,
      nextDayPos: null,
      allDaysDone: false,
      plan: makeCompletedPlan(),
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders plan header and set input variants", () => {
    const plan = makePlan();
    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    expect(screen.getByRole("heading", { name: "Strength Block" })).toBeInTheDocument();
    expect(screen.getByLabelText("Week")).toHaveTextContent("Week 1");
    expect(screen.getByLabelText("Day")).toHaveTextContent("Day 1");
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText("Run 400m at RPE 7")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("8")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("60")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("75%")).toBeInTheDocument();
    expect(screen.getAllByText("kg")).toHaveLength(2);
    expect(screen.getAllByText("of")).toHaveLength(2);
    expect(screen.queryByText("Set 1")).not.toBeInTheDocument();
  });

  it("uses a green outline on saved complete set rows", () => {
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].sets[0].actual = {
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    };

    const { container } = render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    expect(container.querySelector('[data-set-complete="true"]')).toBeInTheDocument();
  });

  it("does not outline sets from unsaved input", async () => {
    const plan = makePlan();

    const { container } = render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("60"), { target: { value: "60" } });

    expect(container.querySelector('[data-set-complete="true"]')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockSaveSetActualsAction).toHaveBeenCalledTimes(1);
    });

    expect(container.querySelector('[data-set-complete="true"]')).toBeInTheDocument();
  });

  it("outlines an exercise only after every set is saved", async () => {
    const plan = makePlan();

    const { container } = render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("60"), { target: { value: "60" } });

    await waitFor(() => {
      expect(mockSaveSetActualsAction).toHaveBeenCalledTimes(1);
    });

    expect(container.querySelectorAll('[data-set-complete="true"]')).toHaveLength(1);
    expect(container.querySelector('[data-exercise-complete="true"]')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("6"), { target: { value: "6" } });
    fireEvent.change(screen.getByPlaceholderText("75%"), { target: { value: "75" } });

    await waitFor(() => {
      expect(mockSaveSetActualsAction).toHaveBeenCalledTimes(2);
    });

    expect(container.querySelectorAll('[data-set-complete="true"]')).toHaveLength(2);
    expect(container.querySelector('[data-exercise-complete="true"]')).toBeInTheDocument();
  });

  it("debounces auto-save instead of saving on every keystroke", async () => {
    vi.useFakeTimers();
    const plan = makePlan();
    mockSaveSetActualsAction.mockResolvedValue({ ok: true });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
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
    mockSaveSetActualsAction.mockResolvedValue({
      ok: false,
      code: "db_error",
      message: "save failed",
    });

    const plan = makePlan();
    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
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
    mockCompleteDayAction.mockResolvedValue({
      ok: true,
      nextDayPos: null,
      allDaysDone: false,
      plan: makeCompletedPlan(),
    });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("60"), { target: { value: "60" } });
    fireEvent.change(screen.getByPlaceholderText("6"), { target: { value: "6" } });
    fireEvent.change(screen.getByPlaceholderText("75%"), { target: { value: "75" } });

    await user.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(mockCompleteDayAction).toHaveBeenCalledWith("assignment-1", 0, 0);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Day completed!")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
  });

  it("opens skip dialog when completing with unfilled sets", async () => {
    const user = userEvent.setup();
    const plan = makePlan();

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Complete" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mockCompleteDayAction).not.toHaveBeenCalled();
  });

  it("confirms skip and completes the day", async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    mockCompleteDayAction.mockResolvedValue({
      ok: true,
      nextDayPos: null,
      allDaysDone: false,
      plan: makeCompletedPlan(),
    });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Complete" }));
    await user.click(screen.getByRole("button", { name: "Skip & Complete" }));

    await waitFor(() => {
      expect(mockCompleteDayAction).toHaveBeenCalledWith("assignment-1", 0, 0);
    });
  });

  it("shows completed set values after finishing a day", async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    mockCompleteDayAction.mockResolvedValue({
      ok: true,
      nextDayPos: null,
      allDaysDone: false,
      plan: makeCompletedPlan(),
    });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("60"), { target: { value: "60" } });
    fireEvent.change(screen.getByPlaceholderText("6"), { target: { value: "6" } });
    fireEvent.change(screen.getByPlaceholderText("75%"), { target: { value: "75" } });

    await user.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() => {
      expect(screen.getByText("Day completed!")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByDisplayValue("6")).toBeInTheDocument();
    expect(screen.getByDisplayValue("75")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
  });

  it("renders plan celebration when all days are done", async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    mockCompleteDayAction.mockResolvedValue({
      ok: true,
      nextDayPos: null,
      allDaysDone: true,
      plan: makeCompletedPlan(),
    });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    fireEvent.change(screen.getByPlaceholderText("60"), { target: { value: "60" } });
    fireEvent.change(screen.getByPlaceholderText("6"), { target: { value: "6" } });
    fireEvent.change(screen.getByPlaceholderText("75%"), { target: { value: "75" } });
    await user.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(screen.getByText("All workouts complete!")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
  });

  it("shows day completed after confirming skip", async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    mockCompleteDayAction.mockResolvedValue({
      ok: true,
      nextDayPos: null,
      allDaysDone: false,
      plan: makeCompletedPlan(),
    });

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Complete" }));
    await user.click(screen.getByRole("button", { name: "Skip & Complete" }));

    await waitFor(() => {
      expect(screen.getByText("Day completed!")).toBeInTheDocument();
    });
  });

  it("renders saved actual values on mount after reload", () => {
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].sets[0].actual = {
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    };
    plan.weeks[0].days[0].blocks[0].exercises[0].sets[1].actual = {
      reps: 6,
      load: { type: "absolute", value: 185, unit: "kg" },
    };

    render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    expect(screen.getByPlaceholderText("8")).toHaveValue("8");
    expect(screen.getByPlaceholderText("60")).toHaveValue("60");
    expect(screen.getByPlaceholderText("6")).toHaveValue("6");
    expect(screen.getByPlaceholderText("75%")).toHaveValue("185");
  });

  it("keeps local input values when parent props refresh for the same day", async () => {
    vi.useFakeTimers();
    const plan = makePlan();
    mockSaveSetActualsAction.mockResolvedValue({ ok: true });

    const { rerender } = render(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={plan}
        coachName="Coach Alex"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "8" } });
    await vi.advanceTimersByTimeAsync(800);

    const refreshedPlan = structuredClone(plan);
    refreshedPlan.weeks[0].days[0].blocks[0].exercises[0].sets[0].actual = { reps: 8 };

    rerender(
      <AthletePlanEntryView
        assignmentId="assignment-1"
        plan={refreshedPlan}
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
        coachName="Coach Alex"
      />,
    );

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });
});
