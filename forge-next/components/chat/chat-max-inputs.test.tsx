import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { InputRequest } from "eve/client";
import { chatInputResponse, parseSelectionAnswer } from "@/lib/chat/input-selection";
import { ChatInputRequest } from "./chat-input-request";
const field = {
  id: "max-1",
  label: "Jay · Bench Press",
  athleteId: "10000000-0000-0000-0000-000000000001",
  exerciseId: "30000000-0000-0000-0000-000000000001",
  unit: "kg",
};
const request: InputRequest = {
  requestId: "question-maxes",
  display: "text",
  prompt: "Add optional maxes, then assign Strength to Jay?",
  action: {
    kind: "tool-call",
    callId: "question-maxes",
    toolName: "ask_question",
    input: { maxInputs: [field] },
  },
};
it("collects positive values and units as steering and restores them on an answered card", async () => {
  const onRespond = vi.fn().mockResolvedValue(undefined);
  const { rerender } = render(
    <ChatInputRequest request={request} disabled={false} onRespond={onRespond} />,
  );
  fireEvent.change(screen.getByRole("spinbutton", { name: field.label }), {
    target: { value: "-1" },
  });
  expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "225" } });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "lb" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(onRespond).toHaveBeenCalledOnce());
  const response = onRespond.mock.calls[0][0];
  expect(JSON.parse(response.text)).toMatchObject({
    status: "confirmed",
    maxes: [{ ...field, unit: "lb", value: 225 }],
  });
  rerender(
    <ChatInputRequest
      request={request}
      disabled
      status="completed"
      savedResponseText={response.text}
      onRespond={onRespond}
    />,
  );
  expect(screen.getByRole("spinbutton")).toHaveValue(225);
  expect(screen.getByRole("spinbutton")).toBeDisabled();
  expect(screen.getByRole("combobox")).toHaveValue("lb");
});
it("allows blank maxes and cancellation without creating a mandatory assignment gate", async () => {
  const onRespond = vi.fn().mockResolvedValue(undefined);
  render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(onRespond).toHaveBeenCalledOnce());
  expect(JSON.parse(onRespond.mock.calls[0][0].text)).toMatchObject({
    status: "confirmed",
    maxes: [],
  });
});
it("marks a filled max card as cancelled without confirming the proposed assignment", async () => {
  const onRespond = vi.fn().mockResolvedValue(undefined);
  render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(onRespond).toHaveBeenCalledOnce());
  expect(JSON.parse(onRespond.mock.calls[0][0].text).status).toBe("cancelled");
});

it("preserves entered max values and units as drafts when answering through chat", () => {
  const onDraftChange = vi.fn();
  const { rerender } = render(<ChatInputRequest request={request} disabled={false} onRespond={vi.fn()} onDraftChange={onDraftChange} />);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "225" } });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "lb" } });
  const response = chatInputResponse(request, "Actually use 200 lb", onDraftChange.mock.lastCall![0]);
  expect(parseSelectionAnswer(response.text)).toMatchObject({ status: "replied", maxes: [{ ...field, unit: "lb", value: 225 }], fieldValues: [{ id: field.id, label: field.label, value: "225", unit: "lb" }] });
  rerender(<ChatInputRequest request={request} disabled={false} status="replied" savedResponseText={response.text} onRespond={vi.fn()} />);
  expect(screen.getByRole("spinbutton")).toHaveValue(225);
  expect(screen.getByRole("spinbutton")).toBeDisabled();
  expect(screen.getByRole("combobox")).toHaveValue("lb");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
