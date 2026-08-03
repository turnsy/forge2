import { fireEvent, render, screen, act } from "@testing-library/react";
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
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/coach/exercises/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ query: "back" }),
      }),
    );
  });
});
