import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CoachAthleteMaxFormModal } from "./coach-athlete-max-form-modal";

it("requires a new selection after editing the visible exercise name", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ exercises: [{ id: "squat", name: "Back Squat" }] })));
  render(<CoachAthleteMaxFormModal open mode="add" saveUrl="/save" onClose={vi.fn()} onSaved={vi.fn()} />);
  const input = screen.getByLabelText("Exercise");
  fireEvent.change(input, { target: { value: "squat" } });
  fireEvent.click(await screen.findByRole("option", { name: "Back Squat" }));
  fireEvent.change(screen.getByLabelText("Max value"), { target: { value: "100" } });
  expect(screen.getByRole("button", { name: "Save max" })).toBeEnabled();
  fireEvent.change(input, { target: { value: "Bench Press" } });
  fireEvent.blur(input);
  expect(input).toHaveValue("Bench Press");
  expect(screen.getByRole("button", { name: "Save max" })).toBeDisabled();
});
