import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CoachAthleteMaxesTab } from "@/components/coach-athlete-maxes-tab";

describe("CoachAthleteMaxesTab", () => {
  it("shows a spinner while maxes are loading", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>(() => {
            /* keep pending */
          }),
      ),
    );

    render(
      <CoachAthleteMaxesTab
        listUrl="/api/coach/athletes/athlete-1/maxes"
        saveUrl="/api/coach/athletes/athlete-1/maxes"
      />,
    );

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByText("No maxes yet")).not.toBeInTheDocument();
  });

  it("filters maxes and opens the add modal", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          maxes: [
            {
              id: "max-1",
              exercise_id: "bench",
              exercise_name: "Bench Press",
              value: 225,
              unit: "lb",
              logged_at: "2026-01-10T00:00:00.000Z",
            },
            {
              id: "max-2",
              exercise_id: "squat",
              exercise_name: "Back Squat",
              value: 315,
              unit: "lb",
              logged_at: "2026-01-11T00:00:00.000Z",
            },
          ],
        }),
      ),
    );

    render(
      <CoachAthleteMaxesTab
        listUrl="/api/coach/athletes/athlete-1/maxes"
        saveUrl="/api/coach/athletes/athlete-1/maxes"
      />,
    );

    expect(await screen.findByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search maxes"), "bench");
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.queryByText("Back Squat")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add max" }));
    expect(screen.getByRole("dialog", { name: "Add max" })).toBeInTheDocument();
  });

  it("shows exercise history when a max is selected", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          maxes: [
            {
              id: "max-1",
              exercise_id: "bench",
              exercise_name: "Bench Press",
              value: 225,
              unit: "lb",
              logged_at: "2026-02-01T00:00:00.000Z",
            },
            {
              id: "max-2",
              exercise_id: "bench",
              exercise_name: "Bench Press",
              value: 215,
              unit: "lb",
              logged_at: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
      ),
    );

    render(
      <CoachAthleteMaxesTab
        listUrl="/api/coach/athletes/athlete-1/maxes"
        saveUrl="/api/coach/athletes/athlete-1/maxes"
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Bench Press" }));

    expect(screen.getByRole("button", { name: "Back to maxes" })).toBeInTheDocument();
    expect(screen.getByText("215 lb")).toBeInTheDocument();
    expect(screen.getAllByText("225 lb").length).toBeGreaterThanOrEqual(1);
  });

  it("does not show update max on the list view", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          maxes: [
            {
              id: "max-1",
              exercise_id: "bench",
              exercise_name: "Bench Press",
              value: 225,
              unit: "lb",
              logged_at: "2026-01-10T00:00:00.000Z",
            },
          ],
        }),
      ),
    );

    render(
      <CoachAthleteMaxesTab
        listUrl="/api/coach/athletes/athlete-1/maxes"
        saveUrl="/api/coach/athletes/athlete-1/maxes"
      />,
    );

    expect(await screen.findByText("Bench Press")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update max" })).not.toBeInTheDocument();
  });

  it("opens the update modal from the exercise detail view", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          maxes: [
            {
              id: "max-1",
              exercise_id: "bench",
              exercise_name: "Bench Press",
              value: 225,
              unit: "lb",
              logged_at: "2026-01-10T00:00:00.000Z",
            },
          ],
        }),
      ),
    );

    render(
      <CoachAthleteMaxesTab
        listUrl="/api/coach/athletes/athlete-1/maxes"
        saveUrl="/api/coach/athletes/athlete-1/maxes"
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Bench Press" }));
    await user.click(screen.getByRole("button", { name: "Update max" }));

    expect(screen.getByRole("dialog", { name: "Update max" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("225")).toBeInTheDocument();
    expect(screen.getByDisplayValue("lb")).toBeInTheDocument();
  });
});
