import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "@/components/chat/chat-composer";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";

describe("ChatComposer", () => {
  it("shows a stop button while streaming", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();

    render(
      <ChatComposer
        state={{
          ...createInitialChatWorkspaceState(),
          phase: "streaming",
        }}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
        onStop={onStop}
      />,
    );

    const stopButton = screen.getByRole("button", { name: "Stop response" });
    expect(stopButton).toBeEnabled();

    await user.click(stopButton);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("shows send instead of stop when idle", () => {
    render(
      <ChatComposer
        state={createInitialChatWorkspaceState()}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Stop response" }),
    ).not.toBeInTheDocument();
  });

  it("shows a stop button while generating even if phase is idle", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();

    render(
      <ChatComposer
        state={{
          ...createInitialChatWorkspaceState(),
          phase: "idle",
          runStatus: "generating",
        }}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
        onStop={onStop}
      />,
    );

    const stopButton = screen.getByRole("button", { name: "Stop response" });
    expect(stopButton).toBeEnabled();

    await user.click(stopButton);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("shows send instead of stop when the user has typed during background generation", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(
      <ChatComposer
        state={{
          ...createInitialChatWorkspaceState(),
          phase: "idle",
          runStatus: "validating",
        }}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={onSend}
        onStop={vi.fn()}
      />,
    );

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "Show me in a table");

    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Stop response" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it("renders reset beside attach when onReset is provided", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <ChatComposer
        state={createInitialChatWorkspaceState()}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
        onReset={onReset}
      />,
    );

    const resetButton = screen.getByRole("button", { name: "Reset conversation" });
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("renders attachments below the composer before the thread starts", () => {
    const { container } = render(
      <ChatComposer
        state={{
          ...createInitialChatWorkspaceState(),
          hasStarted: false,
          attachments: [
            {
              localId: "attach-1",
              status: "uploaded",
              displayLabel: "my plan.csv",
            },
          ],
        }}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const prompt = screen.getByRole("textbox");
    const chip = screen.getByText("my plan.csv");
    expect(
      prompt.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelectorAll(".flex.flex-wrap.gap-2")).toHaveLength(1);
  });

  it("uses a transparent surface in overlay chrome mode", () => {
    const { container } = render(
      <ChatComposer
        overlayChrome
        compact
        state={createInitialChatWorkspaceState()}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const surface = container.querySelector(".rounded-card");
    expect(surface?.className).toContain("bg-transparent");
    expect(surface?.className).not.toContain("bg-glass");
  });

  it("does not render attachments in the composer after the thread starts", () => {
    render(
      <ChatComposer
        state={{
          ...createInitialChatWorkspaceState(),
          hasStarted: true,
          attachments: [
            {
              localId: "attach-1",
              status: "uploaded",
              displayLabel: "my plan.csv",
            },
          ],
        }}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    expect(screen.queryByText("my plan.csv")).not.toBeInTheDocument();
  });
});
