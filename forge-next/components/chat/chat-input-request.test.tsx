import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InputRequest } from "eve/client";
import { ChatInputRequest } from "./chat-input-request";
import { CANCEL_INPUT_REQUEST_TEXT } from "@/lib/chat/input-request-presentation";

const request: InputRequest = {
  requestId: "approval-1",
  prompt: "Assign the selected plan to Jay?",
  display: "confirmation",
  options: [{ id: "approve", label: "Approve" }, { id: "deny", label: "Deny" }],
  action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {} },
};

describe("ChatInputRequest", () => {
  it.each([["Assign plan", "approve"], ["Cancel", "deny"]])("sends an explicit %s response", async (label, optionId) => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
    expect(onRespond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledWith({ requestId: "approval-1", optionId }));
  });

  it("disables approval while the resumed turn is running", () => {
    const onRespond = vi.fn();
    render(<ChatInputRequest request={request} disabled onRespond={onRespond} />);
    fireEvent.click(screen.getByRole("button", { name: "Assign plan" }));
    expect(onRespond).not.toHaveBeenCalled();
  });

  it("supports questions with free-text answers", async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={{ ...request, display: "text", options: undefined }} disabled={false} onRespond={onRespond} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Jay Turnsek" } });
    fireEvent.click(screen.getByRole("button", { name: "Send response" }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledWith({ requestId: "approval-1", text: "Jay Turnsek" }));
  });

  it("keeps the controls available for retry when delivery fails", async () => {
    const onRespond = vi.fn().mockRejectedValue(new Error("network down"));
    render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
    fireEvent.click(screen.getByRole("button", { name: "Assign plan" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Assign plan" })).toBeEnabled();
  });

  it("requires a selection and hides custom input even when the model allows it", async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={{ ...request, display: "select", allowFreeform: true,
      options: [{ id: "jay-1", label: "Jay Turnsek", description: "Athlete" }, { id: "jay-2", label: "Jay T" }],
    }} disabled={false} onRespond={onRespond} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Confirm selection" });
    expect(confirm).toBeDisabled();
    const candidate = screen.getByRole("radio", { name: "Jay Turnsek" });
    expect(candidate).toHaveAccessibleDescription("Athlete");
    fireEvent.click(candidate);
    expect(confirm).toBeEnabled();
    expect(onRespond).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() => expect(onRespond).toHaveBeenCalledWith({ requestId: "approval-1", optionId: "jay-1" }));
  });

  it("cancels a question without choosing any candidate", async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={{ ...request, display: "select" }} disabled={false} onRespond={onRespond} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledWith({ requestId: "approval-1", text: CANCEL_INPUT_REQUEST_TEXT }));
  });

  it("does not expose raw tool names in the confirmation", () => {
    render(<ChatInputRequest request={{ ...request, prompt: "Approve tool call: assign_plan" }} disabled={false} onRespond={vi.fn()} />);
    expect(screen.queryByText(/assign_plan/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign plan" })).toBeEnabled();
  });
});
