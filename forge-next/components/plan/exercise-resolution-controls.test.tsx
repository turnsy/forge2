import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { ExerciseResolutionControls } from "@/components/plan/exercise-resolution-controls";
import { makeExercise } from "@/lib/plans/__tests__/fixtures";

describe("ExerciseResolutionControls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens an empty basis field when Basis is toggled on without an existing basis", async () => {
    const user = userEvent.setup();

    render(
      <ExerciseResolutionControls
        exercise={makeExercise({ name: "Close Grip Bench" })}
        disabled={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Percentage basis exercise")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle percentage basis exercise" }));

    expect(screen.getByLabelText("Percentage basis exercise")).toHaveValue("");
  });

  it("shows an existing basis when the field is opened", () => {
    render(
      <ExerciseResolutionControls
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

  it("does not clear basis when toggling the field closed and open again", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ExerciseResolutionControls
        exercise={makeExercise({
          name: "Close Grip Bench",
          basisRaw: "Bench Press",
          resolvedBasisExerciseId: "bench-1",
        })}
        disabled={false}
        onChange={onChange}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Toggle percentage basis exercise" });

    await user.click(toggle);
    expect(screen.queryByLabelText("Percentage basis exercise")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(toggle);
    expect(screen.getByLabelText("Percentage basis exercise")).toHaveValue("Bench Press");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears basis only when the selected basis matches the exercise name", async () => {
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
      <ExerciseResolutionControls
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
});
