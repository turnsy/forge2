"use client";

import { useRef, useState } from "react";
import { AttachedFileList } from "@/components/attached-file-list";
import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { Button, FadeIn, IconButton } from "@/components/ui";
import type { UserRole } from "@/lib/auth/types";
import { roleLinkClass } from "@/lib/theme";

type AttachedFile = {
  id: string;
  name: string;
};

export function CoachHomePrompt({
  firstName,
  role,
}: {
  firstName: string;
  role: UserRole;
}) {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [dragDepth, setDragDepth] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = dragDepth > 0;

  function addFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setAttachedFiles((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        name: file.name,
      })),
    ]);
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragDepth((current) => current + 1);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragDepth((current) => Math.max(0, current - 1));
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragDepth(0);
    addFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeFile(id: string) {
    setAttachedFiles((current) => current.filter((file) => file.id !== id));
  }

  function handleSend() {
    // AI submission will be wired up later.
  }

  const canSend = message.trim().length > 0 || attachedFiles.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-surface-foreground">
        Welcome back,{" "}
        <span className={roleLinkClass(role)}>{firstName}</span>
      </h1>

      <FadeIn index={0} className="relative w-full text-left">
        <div
          className={`flex min-h-40 flex-col rounded-card border bg-glass p-3 shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md transition ${
            isDragging
              ? "border-coach-muted bg-glass-focus"
              : "border-glass-border"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            multiple
            onChange={handleFileChange}
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask Forge to build or update a plan..."
            rows={3}
            className="min-h-[4.5rem] w-full flex-1 resize-none bg-transparent px-1 py-1 text-base text-surface-foreground outline-none placeholder:text-surface-muted"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  handleSend();
                }
              }
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              icon={<PaperclipIcon />}
              onClick={handleAttachClick}
            >
              Attach
            </Button>
            <IconButton
              variant="primary"
              size="sm"
              icon={<ArrowRightIcon />}
              aria-label="Send"
              disabled={!canSend}
              onClick={handleSend}
            />
          </div>
        </div>

        <AttachedFileList files={attachedFiles} onRemove={removeFile} />
      </FadeIn>
    </div>
  );
}
