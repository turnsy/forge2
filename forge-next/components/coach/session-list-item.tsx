"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { EllipsisIcon } from "@/components/icons/ellipsis-icon";
import { SessionDeleteDialog } from "@/components/coach/session-delete-dialog";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { IconButton, Spinner } from "@/components/ui";
import { renameTaskSession } from "@/lib/chat/actions";

export type SessionListItemData = {
  id: string;
  title: string;
};

export function SessionListItem({
  session,
  isActive = false,
  onOpen,
  onRenamed,
  onDeleted,
  variant = "compact",
}: {
  session: SessionListItemData;
  isActive?: boolean;
  onOpen: (sessionId: string) => void;
  onRenamed: (sessionId: string, title: string) => void;
  onDeleted: (sessionId: string) => void;
  variant?: "compact" | "mobile";
  appearIndex?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(session.title);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!isRenaming) {
      setDraftTitle(session.title);
    }
  }, [isRenaming, session.title]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  function handleOpen() {
    onOpen(session.id);
  }

  function startRename() {
    setDraftTitle(session.title);
    setIsRenaming(true);
  }

  function cancelRename() {
    setDraftTitle(session.title);
    setIsRenaming(false);
  }

  function saveRename() {
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === session.title) {
      cancelRename();
      return;
    }

    startTransition(async () => {
      const result = await renameTaskSession(session.id, trimmed);
      if (result.ok) {
        onRenamed(session.id, trimmed);
        setIsRenaming(false);
        return;
      }

      setDraftTitle(session.title);
      setIsRenaming(false);
    });
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isRenaming) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  }

  const rowClassName = [
    "group flex items-center gap-1 text-sm transition",
    variant === "mobile"
      ? "rounded-[calc(var(--radius-card)-0.25rem)] px-1 py-1"
      : "rounded-xl px-2 py-1.5",
    isActive
      ? "bg-glass text-surface-foreground"
      : "text-surface-muted hover:bg-glass hover:text-surface-foreground",
    isRenaming ? "" : "cursor-pointer",
  ].join(" ");

  const row = (
    <div
      role={isRenaming ? undefined : "button"}
      tabIndex={isRenaming ? -1 : 0}
      aria-current={isActive ? "true" : undefined}
      className={rowClassName}
      onClick={isRenaming ? undefined : handleOpen}
      onKeyDown={handleRowKeyDown}
    >
        {isRenaming ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={draftTitle}
              aria-label="Conversation title"
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-surface-foreground outline-none"
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveRename();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelRename();
                }
              }}
              onBlur={() => {
                if (!pending) {
                  saveRename();
                }
              }}
            />
            {pending ? (
              <Spinner className="h-4 w-4 shrink-0" label="Saving title" />
            ) : (
              <IconButton
                variant="plain"
                size="sm"
                icon={
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                }
                aria-label="Save title"
                onMouseDown={(event) => event.preventDefault()}
                onClick={saveRename}
              />
            )}
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate px-1">{session.title}</span>
            <Dropdown
              menuLabel="Conversation actions"
              trigger={({ toggle, menuId, open }) => (
                <IconButton
                  variant="plain"
                  size="sm"
                  icon={<EllipsisIcon />}
                  aria-label="Conversation actions"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-controls={menuId}
                  className={[
                    "shrink-0 transition",
                    variant === "mobile" || open
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                  ].join(" ")}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle();
                  }}
                />
              )}
            >
              <DropdownItem onSelect={handleOpen}>Open</DropdownItem>
              <DropdownItem onSelect={startRename}>Rename</DropdownItem>
              <DropdownItem destructive onSelect={() => setDeleteOpen(true)}>
                Delete
              </DropdownItem>
            </Dropdown>
          </>
        )}
      </div>
  );

  return (
    <>
      {variant === "mobile" ? (
        <article className="rounded-card border border-glass-border bg-glass px-2 py-1.5 shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md">
          {row}
        </article>
      ) : (
        row
      )}

      {deleteOpen ? (
        <SessionDeleteDialog
          sessionId={session.id}
          title={session.title}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => onDeleted(session.id)}
        />
      ) : null}
    </>
  );
}
