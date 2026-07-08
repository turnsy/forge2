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
});
