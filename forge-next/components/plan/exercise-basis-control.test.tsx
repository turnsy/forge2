import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExerciseBasisControl } from "@/components/plan/exercise-basis-control";
import { makeExercise } from "@/lib/plans/__tests__/fixtures";

describe("ExerciseBasisControl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the exercise name as the default basis", () => {
    render(
      <ExerciseBasisControl
        exercise={makeExercise({ name: "Close Grip Bench" })}
        disabled={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Percentage basis exercise")).toHaveValue(
      "Close Grip Bench",
    );
  });

  it("shows a custom basis when one is set", () => {
    render(
      <ExerciseBasisControl
        exercise={makeExercise({
          name: "Close Grip Bench",
          basisRaw: "Bench Press",
          resolvedBasisExerciseId: "bench-1",
        })}
        disabled={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Percentage basis exercise")).toHaveValue("Bench Press");
  });

  it("clears stored basis when reset to the exercise name", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/search")) {
        return new Response(JSON.stringify({ exercises: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (url.includes("/confirm")) {
        return new Response(
          JSON.stringify({ exercise: { id: "close-grip-1", name: "Close Grip Bench" } }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return new Response(null, { status: 404 });
    });

    const onChange = vi.fn();

    render(
      <ExerciseBasisControl
        exercise={makeExercise({
          name: "Close Grip Bench",
          basisRaw: "Bench Press",
          resolvedBasisExerciseId: "bench-1",
        })}
        disabled={false}
        onChange={onChange}
      />,
    );

    const basisInput = screen.getByLabelText("Percentage basis exercise");
    fireEvent.focus(basisInput);
    fireEvent.change(basisInput, { target: { value: "Close Grip Bench" } });

    fireEvent.click(await screen.findByRole("button", { name: "Close Grip Bench" }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Close Grip Bench",
          basisRaw: undefined,
          resolvedBasisExerciseId: undefined,
        }),
      );
    });
  });

  it("updates basis when a different exercise is selected", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ exercises: [{ id: "bench-1", name: "Bench Press" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const onChange = vi.fn();

    render(
      <ExerciseBasisControl
        exercise={makeExercise({ name: "Close Grip Bench" })}
        disabled={false}
        onChange={onChange}
      />,
    );

    const basisInput = screen.getByLabelText("Percentage basis exercise");
    await user.clear(basisInput);
    await user.type(basisInput, "Bench");

    fireEvent.click(await screen.findByRole("option", { name: "Bench Press" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        basisRaw: "Bench Press",
        resolvedBasisExerciseId: "bench-1",
      }),
    );
  });
});
