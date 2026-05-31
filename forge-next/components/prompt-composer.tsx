"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { MentionMenu } from "@/components/mention-menu";
import { getCaretIndex, setCaretIndex } from "@/lib/prompts/editor-selection";
import { parseEditorToSegments, renderSegmentsToEditor } from "@/lib/prompts/editor-dom";
import type { PromptMentionItem, PromptSegment } from "@/lib/prompts/mention-types";
import {
  buildMirrorTextBeforeAnchor,
  getMentionAnchorPoint,
  shouldFlipMenuAbove,
} from "@/lib/prompts/mention-anchor-position";
import {
  deleteMentionBeforeCaret,
  getActiveMentionQuery,
  getLinearText,
  insertMentionChip,
  isEmptyDocument,
  searchMentionItems,
} from "@/lib/prompts/prompt-document";

const MENU_HEIGHT = 180;
const MENU_OFFSET = 8;

export function PromptComposer({
  mentionItems,
  placeholder,
  onDocumentChange,
  onSend,
}: {
  mentionItems: PromptMentionItem[];
  placeholder: string;
  onDocumentChange?: (segments: PromptSegment[], isEmpty: boolean) => void;
  onSend?: (segments: PromptSegment[]) => void;
}) {
  const menuId = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const skipInputRef = useRef(false);
  const [segments, setSegments] = useState<PromptSegment[]>([]);
  const [caretIndex, setCaretIndexState] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const activeQuery = getActiveMentionQuery(segments, caretIndex);
  const menuItems = activeQuery
    ? searchMentionItems(mentionItems, activeQuery.query, 4)
    : [];
  const menuOpen = activeQuery !== null;

  const syncDocumentState = useCallback(
    (nextSegments: PromptSegment[]) => {
      setSegments(nextSegments);
      onDocumentChange?.(nextSegments, isEmptyDocument(nextSegments));
    },
    [onDocumentChange],
  );

  const readSegmentsFromEditor = useCallback(() => {
    if (!editorRef.current) {
      return [];
    }

    return parseEditorToSegments(editorRef.current);
  }, []);

  const syncCaret = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    setCaretIndexState(getCaretIndex(editorRef.current));
  }, []);

  const applySegmentsToEditor = useCallback(
    (nextSegments: PromptSegment[], nextCaretIndex: number) => {
      if (!editorRef.current) {
        return;
      }

      skipInputRef.current = true;
      renderSegmentsToEditor(editorRef.current, nextSegments);
      setCaretIndex(editorRef.current, nextCaretIndex);
      syncDocumentState(nextSegments);
      skipInputRef.current = false;
    },
    [syncDocumentState],
  );

  const updateAnchor = useCallback(() => {
    if (!editorRef.current || !mirrorRef.current || !activeQuery) {
      setAnchor((current) => (current === null ? current : null));
      return;
    }

    const editor = editorRef.current;
    const mirror = mirrorRef.current;
    if (!markerRef.current) {
      markerRef.current = document.createElement("span");
    }
    const marker = markerRef.current;
    const styles = window.getComputedStyle(editor);
    const linearText = getLinearText(segments);
    const { before, marker: markerChar } = buildMirrorTextBeforeAnchor(
      linearText,
      activeQuery.start,
    );

    mirror.style.width = `${editor.clientWidth}px`;
    mirror.style.font = styles.font;
    mirror.style.lineHeight = styles.lineHeight;
    mirror.style.letterSpacing = styles.letterSpacing;
    mirror.style.padding = styles.padding;
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    mirror.style.overflow = "hidden";
    mirror.scrollTop = editor.scrollTop;
    mirror.replaceChildren();
    mirror.append(document.createTextNode(before));
    mirror.appendChild(marker);
    marker.textContent = markerChar;

    const point = getMentionAnchorPoint(mirror, marker);
    const flip = shouldFlipMenuAbove(
      point.top,
      MENU_HEIGHT,
      window.innerHeight,
    );
    const nextAnchor = {
      top: flip ? point.top - MENU_HEIGHT - MENU_OFFSET : point.top + MENU_OFFSET,
      left: point.left,
    };

    setAnchor((current) => {
      if (
        current &&
        current.top === nextAnchor.top &&
        current.left === nextAnchor.left
      ) {
        return current;
      }

      return nextAnchor;
    });
  }, [activeQuery, segments]);

  useLayoutEffect(() => {
    updateAnchor();
  }, [updateAnchor, caretIndex, menuItems.length, activeQuery?.query]);

  useEffect(() => {
    function handleResize() {
      updateAnchor();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateAnchor]);

  useEffect(() => {
    if (highlightedIndex >= menuItems.length) {
      setHighlightedIndex(0);
    }
  }, [highlightedIndex, menuItems.length]);

  function handleInput() {
    if (skipInputRef.current || !editorRef.current) {
      return;
    }

    syncDocumentState(readSegmentsFromEditor());
    syncCaret();
  }

  function selectMention(item: PromptMentionItem) {
    if (!editorRef.current || !activeQuery) {
      return;
    }

    const currentSegments = readSegmentsFromEditor();
    const nextSegments = insertMentionChip(currentSegments, activeQuery, item);
    const nextCaret = getLinearText(nextSegments).length;
    applySegmentsToEditor(nextSegments, nextCaret);
    setHighlightedIndex(0);
    setCaretIndexState(nextCaret);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (menuOpen && menuItems.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((current) => (current + 1) % menuItems.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex(
          (current) => (current - 1 + menuItems.length) % menuItems.length,
        );
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const item = menuItems[highlightedIndex];
        if (item) {
          selectMention(item);
        }
        return;
      }
    }

    if (menuOpen && event.key === "Escape") {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace" && editorRef.current) {
      const currentCaret = getCaretIndex(editorRef.current);
      const currentSegments = readSegmentsFromEditor();
      const deleted = deleteMentionBeforeCaret(currentSegments, currentCaret);

      if (deleted) {
        event.preventDefault();
        applySegmentsToEditor(deleted.segments, deleted.caretIndex);
        setCaretIndexState(deleted.caretIndex);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey && !menuOpen) {
      event.preventDefault();
      onSend?.(readSegmentsFromEditor());
    }
  }

  return (
    <>
      <div className="relative min-h-[4.5rem] w-full flex-1">
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          aria-haspopup="listbox"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className="prompt-composer min-h-[4.5rem] w-full bg-transparent px-1 py-1 text-base text-surface-foreground outline-none empty:before:text-surface-muted empty:before:content-[attr(data-placeholder)]"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={() => {
            syncCaret();
            updateAnchor();
          }}
          onClick={() => {
            syncCaret();
            updateAnchor();
          }}
          onScroll={() => {
            syncCaret();
            updateAnchor();
          }}
        />
        <div
          aria-hidden
          ref={mirrorRef}
          className="pointer-events-none absolute inset-0 min-h-[4.5rem] overflow-hidden px-1 py-1 opacity-0"
        />
      </div>
      <MentionMenu
        menuId={menuId}
        open={menuOpen}
        items={menuItems}
        highlightedIndex={highlightedIndex}
        anchor={anchor}
        onHighlight={setHighlightedIndex}
        onSelect={selectMention}
      />
    </>
  );
}
