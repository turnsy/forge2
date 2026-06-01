// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { createMentionElement } from "@/lib/prompts/editor-dom";
import { getCaretIndexAfterMentionInsert } from "@/lib/prompts/prompt-document";
import { getCaretIndex, setCaretIndex } from "@/lib/prompts/editor-selection";

function mountEditor(element: HTMLDivElement) {
  element.contentEditable = "true";
  document.body.appendChild(element);
  element.focus();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("editor selection with mention chips", () => {
  it("places the caret after a mention chip trailing space anchor", () => {
    const editor = document.createElement("div");
    mountEditor(editor);
    editor.appendChild(
      createMentionElement({
        type: "mention",
        kind: "athlete",
        id: "a1",
        label: "John Doe",
      }),
    );
    editor.appendChild(document.createTextNode(" \u200B"));

    const caretIndex = getCaretIndexAfterMentionInsert(0, "John Doe");
    setCaretIndex(editor, caretIndex);

    expect(getCaretIndex(editor)).toBe(caretIndex);
  });

  it("maps caret positions inside plain text before a mention", () => {
    const editor = document.createElement("div");
    mountEditor(editor);
    editor.appendChild(document.createTextNode("Hi @ja"));
    editor.appendChild(
      createMentionElement({
        type: "mention",
        kind: "athlete",
        id: "a1",
        label: "John Doe",
      }),
    );

    setCaretIndex(editor, "Hi @ja".length);

    expect(getCaretIndex(editor)).toBe("Hi @ja".length);
  });
});
