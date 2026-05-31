import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromptComposer } from "@/components/prompt-composer";
import type { PromptMentionItem } from "@/lib/prompts/mention-types";

const mentionItems: PromptMentionItem[] = [
  { kind: "athlete", id: "a1", label: "Jane Smith" },
  { kind: "athlete", id: "a2", label: "John Adams" },
  { kind: "plan", id: "p1", label: "Summer Block" },
  { kind: "plan", id: "p2", label: "Winter Base" },
  { kind: "athlete", id: "a3", label: "Jamie Lee" },
];

describe("PromptComposer", () => {
  it("opens the mention menu when @ is typed", async () => {
    const user = userEvent.setup();
    render(
      <PromptComposer
        mentionItems={mentionItems}
        placeholder="Ask Forge..."
      />,
    );

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@");

    expect(screen.getByRole("listbox", { name: /Mention suggestions/i })).toBeInTheDocument();
  });

  it("never shows more than four mention options", async () => {
    const user = userEvent.setup();
    render(
      <PromptComposer
        mentionItems={mentionItems}
        placeholder="Ask Forge..."
      />,
    );

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@");

    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("inserts a mention chip when an option is selected", async () => {
    const user = userEvent.setup();
    render(
      <PromptComposer
        mentionItems={mentionItems}
        placeholder="Ask Forge..."
      />,
    );

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@ja");
    await user.click(screen.getByRole("option", { name: /Jane Smith/i }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editor).toHaveTextContent("Jane Smith");
    expect(editor.querySelector("[data-mention-id='a1']")).toBeTruthy();
  });

  it("keeps the menu open when space is typed in the query", async () => {
    const user = userEvent.setup();
    render(
      <PromptComposer
        mentionItems={mentionItems}
        placeholder="Ask Forge..."
      />,
    );

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@jane ");

    expect(screen.getByRole("listbox", { name: /Mention suggestions/i })).toBeInTheDocument();
    expect(editor.querySelector("[data-mention-id]")).toBeNull();
  });

  it("closes the menu on Escape", async () => {
    const user = userEvent.setup();
    render(
      <PromptComposer
        mentionItems={mentionItems}
        placeholder="Ask Forge..."
      />,
    );

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@jane{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editor).toHaveTextContent("@jane");
  });

  it("selects a mention with Enter instead of sending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(
      <PromptComposer
        mentionItems={mentionItems}
        placeholder="Ask Forge..."
        onSend={onSend}
      />,
    );

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@jane{Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(editor.querySelector("[data-mention-id='a1']")).toBeTruthy();
  });
});
