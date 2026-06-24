import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanDayView } from "@/components/plan/plan-day-view";
import { makeWorkoutPlan as makePlan } from "@/lib/plans/__tests__/fixtures";

const mockSaveSetActualsAction = vi.fn();
const mockCompleteDayAction = vi.fn();

vi.mock("@/lib/athlete/plan/actions", () => ({
  saveSetActualsAction: (...args: unknown[]) => mockSaveSetActualsAction(...args),
  completeDayAction: (...args: unknown[]) => mockCompleteDayAction(...args),
}));

describe("PlanDayView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveSetActualsAction.mockResolvedValue({ ok: true });
    mockCompleteDayAction.mockResolvedValue({
      ok: true,
      nextDayPos: null,
      allDaysDone: false,
      plan: makePlan(),
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows PlanSetTable for coach view", () => {
    render(
      <PlanDayView plan={makePlan()} weekPos={0} dayPos={0} view="coach" />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });

  it("shows athlete read-only layout for completed day with filled green inputs", () => {
    const { container } = render(
      <PlanDayView
        plan={makePlan({ dayComplete: true })}
        weekPos={0}
        dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();

    const completedRow = container.querySelector('[data-set-status="completed"]');
    expect(completedRow).toHaveClass("bg-success-muted");
    expect(completedRow?.querySelector("input")).toHaveAttribute("readonly");
  });

  it("shades skipped sets orange with empty inputs in athlete read-only view", () => {
    const { container } = render(
      <PlanDayView
        plan={makePlan({ dayComplete: true, includeSkippedSet: true })}
        weekPos={0}
        dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByPlaceholderText("5")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("80")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("5")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("80")).not.toBeInTheDocument();

    const skippedRow = container.querySelector('[data-set-status="skipped"]');
    expect(skippedRow).toHaveClass("bg-orange-500/10");
    expect(skippedRow).toHaveAttribute("data-set-complete", "false");
  });

  it("shows set inputs for athlete editable view on incomplete day", () => {
    render(
      <PlanDayView
        plan={makePlan()}
          weekPos={0}
          dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByPlaceholderText("8")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("60")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows exercise and set notes in athlete editable view", () => {
    render(
      <PlanDayView
        plan={makePlan({
          exerciseNotes: "Brace hard on each rep",
          setNotes: "Leave 2 reps in reserve",
        })}
        weekPos={0}
        dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByText("Brace hard on each rep")).toBeInTheDocument();
    expect(screen.getByText("Leave 2 reps in reserve")).toBeInTheDocument();
  });

  it("shows Complete button for athlete editable view", () => {
    render(
      <PlanDayView
        plan={makePlan()}
          weekPos={0}
          dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByRole("button", { name: "Complete" })).toBeInTheDocument();
  });

  it("hides Complete button for read-only views", () => {
    const { rerender } = render(
      <PlanDayView plan={makePlan()} weekPos={0} dayPos={0} view="coach" />,
    );

    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();

    rerender(
      <PlanDayView
        plan={makePlan({ dayComplete: true })}
        weekPos={0}
        dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
  });

  it("shows Day not found empty state for out-of-bounds indices", () => {
    render(
      <PlanDayView plan={makePlan()} weekPos={99} dayPos={99} view="coach" />,
    );

    expect(screen.getByText("Day not found")).toBeInTheDocument();
  });

  it("renders editable coach inputs when onPlanChange is provided", () => {
    render(
      <PlanDayView
        plan={makePlan()}
          weekPos={0}
          dayPos={0}
        view="coach"
        readOnly={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Back Squat")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Set 1 reps")[0]).toBeInTheDocument();
  });

  it("disables editable inputs when disabled is true", () => {
    render(
      <PlanDayView
        plan={makePlan()}
          weekPos={0}
          dayPos={0}
        view="coach"
        readOnly={false}
        disabled
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Back Squat")).toHaveAttribute("readonly");
  });

  it("calls onPlanChange when editing set reps", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();
    render(
      <PlanDayView
        plan={makePlan()}
          weekPos={0}
          dayPos={0}
        view="coach"
        readOnly={false}
        onPlanChange={onPlanChange}
      />,
    );

    const repsInput = screen.getAllByLabelText("Set 1 reps")[0];
    await user.clear(repsInput);
    await user.type(repsInput, "12");

    expect(onPlanChange).toHaveBeenCalled();
  });

  it("still renders read-only coach table when readOnly is true", () => {
    render(
      <PlanDayView
        plan={makePlan()}
          weekPos={0}
          dayPos={0}
        view="coach"
        readOnly
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("still renders read-only coach table when onPlanChange is not provided", () => {
    render(
      <PlanDayView plan={makePlan()} weekPos={0} dayPos={0} view="coach" />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders locked coach day view for completed days in edit mode", () => {
    render(
      <PlanDayView
        plan={makePlan({ dayComplete: true })}
        weekPos={0}
        dayPos={0}
        view="coach"
        readOnly={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("coach-locked-day")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add exercise" })).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows athlete video button when exercise has a videoUrl", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].videoUrl = "https://youtu.be/demo";

    render(
      <PlanDayView
        plan={plan}
          weekPos={0}
          dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    const videoButton = screen.getByLabelText("Watch exercise video");
    expect(videoButton).toBeInTheDocument();

    await user.click(videoButton);
    expect(openSpy).toHaveBeenCalledWith(
      "https://youtu.be/demo",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });

  it("hides athlete video button when exercise has no videoUrl", () => {
    render(
      <PlanDayView
        plan={makePlan()}
          weekPos={0}
          dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.queryByLabelText("Watch exercise video")).not.toBeInTheDocument();
  });

  it("shows athlete video button in read-only completed day view", () => {
    const plan = makePlan({ dayComplete: true });
    plan.weeks[0].days[0].blocks[0].exercises[0].videoUrl = "https://youtu.be/demo";

    render(
      <PlanDayView
        plan={plan}
          weekPos={0}
          dayPos={0}
        view="athlete"
        assignmentId="assignment-1"
      />,
    );

    expect(screen.getByLabelText("Watch exercise video")).toBeInTheDocument();
  });

  it("shows video link indicator in coach read-only view when videoUrl is set", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].videoUrl = "https://youtu.be/demo";

    render(
      <PlanDayView plan={plan} weekPos={0} dayPos={0} view="coach" />,
    );

    const videoButton = screen.getByLabelText("Video link attached");
    expect(videoButton).toBeInTheDocument();
    expect(screen.queryByLabelText("Add video link")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Watch exercise video")).not.toBeInTheDocument();

    await user.click(videoButton);
    expect(openSpy).toHaveBeenCalledWith(
      "https://youtu.be/demo",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });

  it("hides video indicator in coach read-only view when no videoUrl is set", () => {
    render(
      <PlanDayView plan={makePlan()} weekPos={0} dayPos={0} view="coach" />,
    );

    expect(screen.queryByLabelText("Video link attached")).not.toBeInTheDocument();
  });
});
