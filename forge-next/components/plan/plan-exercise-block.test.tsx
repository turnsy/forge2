import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import type { Exercise } from "@/lib/plans/workout-plan";

function makeExercise(videoUrl?: string): Exercise {
  return {
    name: "Back Squat",
    videoUrl,
    sets: [
      {
        id: "set-1",
        planned: {
          type: "exact",
          reps: 5,
          load: { type: "absolute", value: 135, unit: "lb" },
        },
        actual: null,
        status: "planned",
        locked: false,
      },
    ],
  };
}

describe("PlanExerciseBlock", () => {
  it("shows a video icon when exercise has a videoUrl", () => {
    render(
      <PlanExerciseBlock
        exercise={makeExercise("https://youtu.be/demo")}
        view="coach"
      />,
    );

    expect(screen.getByLabelText("Video link attached")).toBeInTheDocument();
  });

  it("hides the video icon when exercise has no videoUrl", () => {
    render(<PlanExerciseBlock exercise={makeExercise()} view="coach" />);

    expect(screen.queryByLabelText("Video link attached")).not.toBeInTheDocument();
  });

  it("opens the video link in a new tab when the icon is clicked", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <PlanExerciseBlock
        exercise={makeExercise("https://youtu.be/demo")}
        view="coach"
      />,
    );

    await user.click(screen.getByLabelText("Video link attached"));

    expect(openSpy).toHaveBeenCalledWith(
      "https://youtu.be/demo",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });
});
