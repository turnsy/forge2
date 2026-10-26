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

  it("selects an existing result without creating an exercise", async () => {
    const onResolved = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ exercises: [{ id: "squat", name: "Back Squat" }] }));
    render(<ExerciseSearchField label="Exercise" value="" disabled={false} onResolved={onResolved} />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "squat" } });
    fireEvent.click(await screen.findByRole("option", { name: "Back Squat" }));
    expect(onResolved).toHaveBeenCalledWith({ name: "Back Squat", exerciseId: "squat" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not offer creation for athletes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ exercises: [{ id: "bench", name: "Bench Press" }] }));
    render(<ExerciseSearchField label="Exercise" value="" disabled={false} allowCreate={false} onResolved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "bench" } });
    expect(await screen.findByRole("option", { name: "Bench Press" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create/ })).not.toBeInTheDocument();
  });

  it("shows creation failures instead of silently dropping the request", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => String(input).includes("/search")
      ? Response.json({ exercises: [] }) : Response.json({ error: "failed" }, { status: 422 }));
    render(<ExerciseSearchField label="Exercise" value="" disabled={false} onResolved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "New Lift" } });
    fireEvent.click(await screen.findByRole("button", { name: "Create “New Lift”" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not create exercise");
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

  it("reverts draft on blur by default", () => {
    render(
      <ExerciseSearchField
        label="Exercise"
        value="Bench Press"
        disabled={false}
        onResolved={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Exercise");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Incline Bench" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("Bench Press");
  });

  it("keeps draft text on blur when revertOnBlur is false", () => {
    render(
      <ExerciseSearchField
        label="Exercise"
        value=""
        disabled={false}
        revertOnBlur={false}
        onResolved={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Exercise");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Incline Bench" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("Incline Bench");
  });

  it("shows a custom entry alongside partial catalog matches", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ exercises: [{ id: "bench-1", name: "Bench Press" }] }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    render(
      <ExerciseSearchField
        label="Percentage basis exercise"
        value=""
        disabled={false}
        onResolved={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Percentage basis exercise");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Close Grip Bench" } });

    expect(await screen.findByRole("option", { name: "Bench Press" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create “Close Grip Bench”" })).toBeInTheDocument();
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
      await screen.findByRole("button", { name: "Create “Zercher Squat”" }),
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
