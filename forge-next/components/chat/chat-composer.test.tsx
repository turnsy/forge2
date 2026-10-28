import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "@/components/chat/chat-composer";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";

describe("ChatComposer", () => {
  it("attaches a pasted image while still requiring text to send", () => {
    const onAttach = vi.fn();
    const onSend = vi.fn();
    render(<ChatComposer state={createInitialChatWorkspaceState()} composerKey="image-paste" onAttach={onAttach} onSend={onSend} />);
    const file = new File(["image"], "screenshot.png", { type: "image/png" });
    fireEvent.paste(screen.getByRole("textbox"), { clipboardData: { files: [file], getData: () => "" } });
    expect(onAttach).toHaveBeenCalledWith([file]);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends on desktop Enter", async () => {
    const onSend = vi.fn(); const user = userEvent.setup();
    render(<ChatComposer state={createInitialChatWorkspaceState()} composerKey="desktop-enter" onAttach={vi.fn()} onSend={onSend} />);
    await user.click(screen.getByRole("textbox")); await user.type(screen.getByRole("textbox"), "Hello");
    await user.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledExactlyOnceWith([{ type: "text", value: "Hello" }]);
  });
  it("keeps mobile Enter as a newline", async () => {
    const original = window.matchMedia("(max-width: 767px)");
    const previousMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn(() => ({ ...original, matches: true }));
    try {
      const onSend = vi.fn(); const user = userEvent.setup();
      render(<ChatComposer state={createInitialChatWorkspaceState()} composerKey="mobile-enter" onAttach={vi.fn()} onSend={onSend} />);
      await user.click(screen.getByRole("textbox")); await user.type(screen.getByRole("textbox"), "Hello"); await user.keyboard("{Enter}");
      expect(onSend).not.toHaveBeenCalled(); expect(screen.getByRole("textbox").textContent).toBe("Hello\n");
    } finally { window.matchMedia = previousMatchMedia; }
  });
  it.each(["Shift+Enter", "insertParagraph", "insertLineBreak"])(
    "%s inserts a new line and only the Send button sends the full message",
    async (action) => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(
        <ChatComposer
          state={createInitialChatWorkspaceState()}
          composerKey="newline-test"
          onAttach={vi.fn()}
          onSend={onSend}
        />,
      );
      const editor = screen.getByRole("textbox");
      await user.click(editor);
      await user.type(editor, "First line");
      if (action === "Enter" || action === "Shift+Enter") {
        await user.keyboard(action === "Enter" ? "{Enter}" : "{Shift>}{Enter}{/Shift}");
      } else {
        fireEvent(editor, new InputEvent("beforeinput", {
          inputType: action, bubbles: true, cancelable: true,
        }));
      }
      await user.type(editor, "Second line");
      expect(editor.textContent).toBe("First line\nSecond line");
      expect(onSend).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(onSend).toHaveBeenCalledExactlyOnceWith([
        { type: "text", value: "First line\nSecond line" },
      ]);
    },
  );

  it.each(["", "Please use: "])(
    "sends pasted text in full after the prefix %j",
    async (prefix) => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(
        <ChatComposer
          state={createInitialChatWorkspaceState()}
          composerKey="paste-test"
          onAttach={vi.fn()}
          onSend={onSend}
        />,
      );
      const editor = screen.getByRole("textbox");
      await user.click(editor);
      if (prefix) await user.type(editor, prefix);

      fireEvent.paste(editor, {
        clipboardData: {
          getData: (format: string) =>
            format === "text/plain"
              ? "Week 1\r\nSquat 3 × 5\n\nRest 2 minutes"
              : "<p>Week 1</p><p>Squat 3 × 5</p><p>Rest 2 minutes</p>",
        },
      });

      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
      expect(editor.textContent).toBe(
        `${prefix}Week 1\nSquat 3 × 5\n\nRest 2 minutes`,
      );
      expect(editor.querySelector("p")).toBeNull();
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(onSend).toHaveBeenCalledExactlyOnceWith([
        { type: "text", value: `${prefix}Week 1\nSquat 3 × 5\n\nRest 2 minutes` },
      ]);
    },
  );

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

    const resetButton = screen.getByRole("button", { name: "New conversation" });
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

  it("keeps actions inside the darker overlay prompt surface", () => {
    const { container } = render(
      <ChatComposer
        overlayChrome
        compact
        state={createInitialChatWorkspaceState()}
        composerKey="composer-1"
        onAttach={vi.fn()}
        onSend={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const surface = container.querySelector(".rounded-card.border");
    expect(surface).not.toBeNull();
    expect(surface?.className).toContain("bg-surface/80");

    const scoped = within(surface as HTMLElement);
    expect(scoped.getByRole("textbox")).toBeInTheDocument();
    expect(scoped.getByRole("button", { name: "Attach" })).toBeInTheDocument();
    expect(
      scoped.getByRole("button", { name: "New conversation" }),
    ).toBeInTheDocument();
    expect(scoped.getByRole("button", { name: "Send" })).toBeInTheDocument();
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
