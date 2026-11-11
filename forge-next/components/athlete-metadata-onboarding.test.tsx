import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/metadata/client", () => ({ metadataRequest: vi.fn() }));
import { metadataRequest } from "@/lib/metadata/client";
import { AthleteLinkForm } from "./athlete-link-form";
const request = vi.mocked(metadataRequest);
beforeEach(() => {
  vi.resetAllMocks();
});
it("previews coach questions and permits submitting with required fields unanswered", async () => {
  render(<AthleteLinkForm />);
  fireEvent.change(screen.getByRole("textbox", { name: "Invite code" }), {
    target: { value: "COACH123" },
  });
  request.mockResolvedValueOnce({
    fields: [
      {
        id: "field",
        coach_id: "coach",
        version: 1,
        label: "Sport",
        type: "text",
        required: true,
        options: [],
        position: 0,
        archived: false,
      },
    ],
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByRole("textbox", { name: "Sport · Required" });
  request.mockResolvedValueOnce({ ok: true });
  fireEvent.click(screen.getByRole("button", { name: "Submit link request" }));
  await screen.findByRole("button", { name: "Submit link request" });
  expect(request).toHaveBeenLastCalledWith("/api/metadata/invite", {
    code: "COACH123",
    answers: [],
  });
});
it("shows invalid-code failures and lets the athlete retry", async () => {
  request.mockRejectedValueOnce(new Error("Invalid invite code"));
  render(<AthleteLinkForm />);
  fireEvent.change(screen.getByRole("textbox", { name: "Invite code" }), {
    target: { value: "bad" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Invalid invite code",
  );
  expect(screen.getByRole("textbox", { name: "Invite code" })).toHaveValue(
    "bad",
  );
});
