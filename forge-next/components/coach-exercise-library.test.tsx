import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CoachExerciseLibrary } from "./coach-exercise-library";
vi.mock("@/components/plan/exercise-search-field", () => ({
  ExerciseSearchField: ({
    onResolved,
  }: {
    onResolved: (value: { exerciseId: string; name: string }) => void;
  }) => (
    <button onClick={() => onResolved({ exerciseId: "replacement", name: "Front squat" })}>
      Choose replacement
    </button>
  ),
}));

it("renames inline and refreshes the list", async () => {
  let name = "Squat";
  const fetch = vi.fn(async (_url: unknown, options?: RequestInit) => {
    if (options?.method === "POST") {
      name = JSON.parse(String(options.body)).name;
      return Response.json({ ok: true });
    }
    return Response.json({ exercises: [{ id: "squat", name }], hasMore: false });
  });
  vi.stubGlobal("fetch", fetch);
  render(<CoachExerciseLibrary />);
  await screen.findByText("Squat");
  fireEvent.click(screen.getByRole("button", { name: "Rename" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Exercise name" }), {
    target: { value: "Back squat" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Back squat")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(
    "/api/coach/exercises/squat",
    expect.objectContaining({ body: JSON.stringify({ name: "Back squat" }) }),
  );
});

it("shows usage and requires a replacement before deleting a used exercise", async () => {
  const fetch = vi.fn(async (url: unknown, options?: RequestInit) =>
    options?.method === "POST"
      ? Response.json({ ok: true })
      : String(url).includes("/squat")
        ? Response.json({ templates: 2, assignments: 1 })
        : Response.json({ exercises: [{ id: "squat", name: "Squat" }], hasMore: false }),
  );
  vi.stubGlobal("fetch", fetch);
  render(<CoachExerciseLibrary />);
  await screen.findByText("Squat");
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  const dialog = screen.getByRole("dialog", { name: "Delete Squat?" });
  expect(
    await within(dialog).findByText(/Used in 2 plan templates and 1 active assignments/),
  ).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Delete exercise" })).toBeDisabled();
  expect(
    within(dialog).getByText(/Recorded workouts and max history will be kept/),
  ).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Choose replacement" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete exercise" }));
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      "/api/coach/exercises/squat",
      expect.objectContaining({
        body: JSON.stringify({ archive: true, replacementId: "replacement" }),
      }),
    ),
  );
});

it("shows load errors and the empty state", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(Response.json({ error: "Could not load exercises." }, { status: 500 })),
  );
  render(<CoachExerciseLibrary />);
  expect(await screen.findByText("Could not load exercises.")).toBeInTheDocument();
});
