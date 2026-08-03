import { fireEvent, render, screen, act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExerciseSearchField } from "@/components/plan/exercise-search-field";

describe("ExerciseSearchField", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not search on mount", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <ExerciseSearchField
        label="Exercise"
        value="Back Squat"
        disabled={false}
        onResolved={vi.fn()}
      />,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("debounces search while typing", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ exercises: [{ id: "ex-1", name: "Back Squat" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <ExerciseSearchField
        label="Exercise"
        value=""
        disabled={false}
        onResolved={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "back" } });
    expect(fetchSpy).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not confirm on blur without selecting a result", async () => {
    const onResolved = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ exercises: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <ExerciseSearchField
        label="Exercise"
        value="Bench Press"
        disabled={false}
        onResolved={onResolved}
      />,
    );

    const input = screen.getByLabelText("Exercise");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Incline Bench" } });
    fireEvent.blur(input);

    expect(onResolved).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalledWith(
      "/api/coach/exercises/confirm",
      expect.anything(),
    );
  });

  it("creates a custom exercise only when the create action is clicked", async () => {
    const onResolved = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/search")) {
        return new Response(JSON.stringify({ exercises: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (url.includes("/confirm")) {
        return new Response(JSON.stringify({ exercise: { id: "custom-1", name: "Zercher Squat" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(null, { status: 404 });
    });

    render(
      <ExerciseSearchField
        label="Exercise"
        value="Back Squat"
        disabled={false}
        onResolved={onResolved}
      />,
    );

    const input = screen.getByLabelText("Exercise");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Zercher Squat" } });

    fireEvent.click(
      await screen.findByRole("button", { name: "Zercher Squat" }),
    );

    await waitFor(() => {
      expect(onResolved).toHaveBeenCalledWith({
        name: "Zercher Squat",
        exerciseId: "custom-1",
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/coach/exercises/confirm",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Zercher Squat" }),
      }),
    );
  });
});
