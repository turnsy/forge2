import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AthleteMetadataEditor } from "./athlete-metadata-editor";
import { MetadataFieldEditor } from "./metadata-field-editor";
import type { Field } from "@/lib/metadata/domain";
vi.mock("@/lib/metadata/client", () => ({ metadataRequest: vi.fn() }));
import { metadataRequest } from "@/lib/metadata/client";
const request = vi.mocked(metadataRequest);
const field: Field = {
  id: "30000000-0000-4000-8000-000000000001",
  coach_id: "coach",
  version: 3,
  label: "Weight",
  type: "number",
  unit: "kg",
  required: true,
  options: [],
  position: 0,
  archived: false,
};
beforeEach(() => vi.resetAllMocks());
it("saves only changed answers with the definition version and supports clearing", async () => {
  request.mockResolvedValueOnce({
    fields: [field],
    values: [{ field_id: field.id, value: 60 }],
    missing: [],
  });
  render(<AthleteMetadataEditor athleteId="athlete" />);
  const input = await screen.findByRole("spinbutton", {
    name: "Weight (kg) · Required",
  });
  expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "" } });
  request.mockResolvedValueOnce({
    fields: [field],
    values: [{ field_id: field.id, value: null }],
    missing: [field],
  });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByText("Profile saved.");
  expect(request).toHaveBeenLastCalledWith("/api/metadata", {
    op: "values",
    athleteId: "athlete",
    answers: [{ fieldId: field.id, version: 3, value: null }],
  });
  expect(screen.getByText(/1 required fields missing/)).toBeInTheDocument();
});
it("keeps edits and reports stale-field failures", async () => {
  request.mockResolvedValueOnce({
    fields: [field],
    values: [],
    missing: [field],
  });
  render(<AthleteMetadataEditor athleteId="athlete" />);
  fireEvent.change(
    await screen.findByRole("spinbutton", { name: "Weight (kg) · Required" }),
    { target: { value: "55" } },
  );
  request.mockRejectedValueOnce(
    new Error("Field changed. Refresh and try again."),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Field changed");
  expect(screen.getByRole("spinbutton")).toHaveValue(55);
  expect(screen.getByRole("button", { name: "Reload profile" })).toBeEnabled();
});
it("creates an arbitrary categorical field with stable option IDs and reports its impact", async () => {
  request.mockResolvedValueOnce({ fields: [] });
  render(<MetadataFieldEditor />);
  await screen.findByText("No profile fields yet.");
  fireEvent.click(screen.getByRole("button", { name: "Add field" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Field name" }), {
    target: { value: "Training group" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Field type" }), {
    target: { value: "single_select" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
  fireEvent.click(screen.getByRole("button", { name: "Add option" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Option 1" }), {
    target: { value: "Development" },
  });
  request
    .mockResolvedValueOnce({ missingAthleteCount: 12 })
    .mockResolvedValueOnce({ fields: [] });
  fireEvent.click(screen.getByRole("button", { name: "Save field" }));
  await screen.findByText(
    "Field saved. 12 athletes are now missing this field.",
  );
  expect(request).toHaveBeenCalledWith(
    "/api/metadata",
    expect.objectContaining({
      op: "field",
      definition: expect.objectContaining({
        label: "Training group",
        type: "single_select",
        required: true,
        options: [{ id: expect.any(String), label: "Development" }],
      }),
    }),
  );
});
it("renders an empty profile and history without forcing answers", async () => {
  request.mockResolvedValueOnce({ fields: [], values: [], missing: [] });
  render(<AthleteMetadataEditor />);
  await screen.findByText("No custom profile fields have been defined.");
  request.mockResolvedValueOnce({ events: [], fields: [] });
  fireEvent.click(screen.getByRole("button", { name: "View change history" }));
  await waitFor(() =>
    expect(screen.getByText("No changes recorded.")).toBeInTheDocument(),
  );
});

it("renders historical values with their original units after the current field unit changes", async () => {
  request.mockResolvedValueOnce({
    fields: [{ ...field, unit: "lb" }],
    values: [],
    missing: [],
  });
  render(<AthleteMetadataEditor athleteId="athlete" />);
  await screen.findByRole("spinbutton", { name: "Weight (lb) · Required" });
  request.mockResolvedValueOnce({
    fields: [{ ...field, unit: "lb" }],
    events: [
      {
        id: 1,
        field_id: field.id,
        value: 60,
        definition: { ...field, unit: "kg" },
        actor_id: "coach",
        actor: { full_name: "Coach Alex", role: "coach" },
        created_at: "2026-10-29T12:00:00Z",
      },
    ],
  });
  fireEvent.click(screen.getByRole("button", { name: "View change history" }));
  expect(await screen.findByText(/Weight: 60 kg/)).toHaveTextContent(
    "Coach Alex",
  );
});
