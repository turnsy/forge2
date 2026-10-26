import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InputRequest } from "eve/client";
import { ChatInputRequest } from "./chat-input-request";

const request: InputRequest = {
  requestId: "approval-1",
  prompt: "Assign the selected plan to Jay?",
  display: "confirmation",
  options: [{ id: "approve", label: "Approve" }, { id: "deny", label: "Deny" }],
  action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {} },
};

describe("ChatInputRequest", () => {
  it.each(["Approve", "Deny"])("sends an explicit %s response", async (label) => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
    expect(onRespond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledWith({ requestId: "approval-1", optionId: label.toLowerCase() }));
  });

  it("disables approval while the resumed turn is running", () => {
    const onRespond = vi.fn();
    render(<ChatInputRequest request={request} disabled onRespond={onRespond} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });
});
