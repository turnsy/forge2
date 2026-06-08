"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { MentionMenu } from "@/components/prompt/mention-menu";
import {
  focusCaretAtIndex,
  getCaretIndex,
  getCoordinatesAtLinearIndex,
} from "@/lib/prompts/editor-selection";
import { parseEditorToSegments, renderSegmentsToEditor } from "@/lib/prompts/editor-dom";
import { buildMentionMenuAnchor } from "@/lib/prompts/mentions/anchor-position";
import { flattenMentionSearchGroups } from "@/lib/prompts/mentions/search";
import type { PromptMentionItem, PromptSegment } from "@/lib/prompts/mentions/types";
import { useMentionSearch } from "@/lib/prompts/mentions/use-search";
import {
  deleteMentionBeforeCaret,
  getActiveMentionQuery,
  getCaretIndexAfterMentionInsert,
  insertMentionChip,
  isEmptyDocument,
} from "@/lib/prompts/prompt-document";

const MENU_HEIGHT = 180;
const MENU_OFFSET = 4;

type SuppressedMentionRange = {
  start: number;
  end: number;
};

export function PromptComposer({
  placeholder,
  onDocumentChange,
  onSend,
  compact = false,
}: {
  placeholder: string;
  onDocumentChange?: (segments: PromptSegment[], isEmpty: boolean) => void;
  onSend?: (segments: PromptSegment[]) => void;
  compact?: boolean;
}) {
  const menuId = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const skipInputRef = useRef(false);
  const [segments, setSegments] = useState<PromptSegment[]>([]);
  const [caretIndex, setCaretIndexState] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [anchor, setAnchor] = useState<ReturnType<
    typeof buildMentionMenuAnchor
  > | null>(null);
  const [suppressedRange, setSuppressedRange] =
    useState<SuppressedMentionRange | null>(null);

  const activeQuery = getActiveMentionQuery(segments, caretIndex);
  const menuVisible =
    activeQuery !== null &&
    (suppressedRange === null ||
      suppressedRange.start !== activeQuery.start ||
      suppressedRange.end !== activeQuery.end);
  const { groups: mentionGroups, loading: mentionLoading } = useMentionSearch(
    activeQuery?.query ?? null,
    menuVisible,
  );
  const menuItems = flattenMentionSearchGroups(mentionGroups);
  const activeHighlightedIndex =
    menuItems.length === 0 ? 0 : highlightedIndex % menuItems.length;

  const syncDocumentState = useCallback(
    (nextSegments: PromptSegment[], nextCaret?: number) => {
      setSegments(nextSegments);
      if (nextCaret !== undefined) {
        setCaretIndexState(nextCaret);
        if (!getActiveMentionQuery(nextSegments, nextCaret)) {
          setSuppressedRange(null);
        }
      }
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

    syncDocumentState(
      readSegmentsFromEditor(),
      getCaretIndex(editorRef.current),
    );
  }, [readSegmentsFromEditor, syncDocumentState]);

  const dismissMenu = useCallback(() => {
    if (!activeQuery) {
      return;
    }

    setSuppressedRange({
      start: activeQuery.start,
      end: activeQuery.end,
    });
  }, [activeQuery]);

  const applySegmentsToEditor = useCallback(
    (nextSegments: PromptSegment[], nextCaretIndex: number) => {
      if (!editorRef.current) {
        return;
      }

      skipInputRef.current = true;
      renderSegmentsToEditor(editorRef.current, nextSegments);
      syncDocumentState(nextSegments);
      focusCaretAtIndex(editorRef.current, nextCaretIndex);
      requestAnimationFrame(() => {
        if (!editorRef.current) {
          skipInputRef.current = false;
          return;
        }

        focusCaretAtIndex(editorRef.current, nextCaretIndex);
        setCaretIndexState(nextCaretIndex);
        skipInputRef.current = false;
      });
    },
    [syncDocumentState],
  );

  const updateAnchor = useCallback(() => {
    if (!editorRef.current || !activeQuery || !menuVisible) {
      setAnchor((current) => (current === null ? current : null));
      return;
    }

    const point = getCoordinatesAtLinearIndex(
      editorRef.current,
      activeQuery.start,
    );
    const nextAnchor = buildMentionMenuAnchor(point, {
      maxMenuHeight: MENU_HEIGHT,
      offset: MENU_OFFSET,
      viewportHeight: window.innerHeight,
    });

    setAnchor((current) => {
      if (
        current &&
        current.top === nextAnchor.top &&
        current.left === nextAnchor.left &&
        current.placement === nextAnchor.placement
      ) {
        return current;
      }

      return nextAnchor;
    });
  }, [activeQuery, menuVisible]);

  useLayoutEffect(() => {
    updateAnchor();
  }, [updateAnchor, caretIndex, menuItems.length, activeQuery?.query, menuVisible]);

  useEffect(() => {
    function handleResize() {
      updateAnchor();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateAnchor]);

  useEffect(() => {
    if (!menuVisible) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (editorRef.current?.contains(target)) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest("[data-mention-menu]")
      ) {
        return;
      }

      dismissMenu();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [dismissMenu, menuVisible]);

  function handleInput() {
    if (skipInputRef.current || !editorRef.current) {
      return;
    }

    syncCaret();
  }

  function selectMention(item: PromptMentionItem) {
    if (!editorRef.current || !activeQuery) {
      return;
    }

    const currentSegments = readSegmentsFromEditor();
    const nextSegments = insertMentionChip(currentSegments, activeQuery, item);
    const nextCaret = getCaretIndexAfterMentionInsert(
      activeQuery.start,
      item.label,
    );
    applySegmentsToEditor(nextSegments, nextCaret);
    setHighlightedIndex(0);
    setCaretIndexState(nextCaret);
    setSuppressedRange(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (menuVisible && !mentionLoading && menuItems.length > 0) {
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
        const item = menuItems[activeHighlightedIndex];
        if (item) {
          selectMention(item);
        }
        return;
      }
    }

    if (menuVisible && event.key === "Escape") {
      event.preventDefault();
      dismissMenu();
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

    if (event.key === "Enter" && !event.shiftKey && !menuVisible) {
      event.preventDefault();
      onSend?.(readSegmentsFromEditor());
    }
  }

  return (
    <>
      <div
        className={`relative w-full flex-1 ${compact ? "min-h-[2.75rem]" : "min-h-[4.5rem]"}`}
      >
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-controls={menuVisible ? menuId : undefined}
          aria-haspopup="listbox"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className={`prompt-composer w-full bg-transparent px-1 py-1 text-surface-foreground outline-none empty:before:text-surface-muted empty:before:content-[attr(data-placeholder)] ${
            compact ? "min-h-[2.75rem] text-sm" : "min-h-[4.5rem] text-base"
          }`}
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
      </div>
      <MentionMenu
        menuId={menuId}
        open={menuVisible}
        groups={mentionGroups}
        highlightedIndex={activeHighlightedIndex}
        anchor={anchor}
        loading={mentionLoading}
        onHighlight={setHighlightedIndex}
        onSelect={selectMention}
      />
    </>
  );
}
