"use client";

import { useRef, useState } from "react";
import { ChatAttachment } from "@/components/chat/chat-attachment";
import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { PromptComposer } from "@/components/prompt/prompt-composer";
import { Button, FadeIn, IconButton } from "@/components/ui";
import { canSendChat } from "@/lib/chat/workspace-selectors";
import type { ChatWorkspaceState } from "@/lib/chat/types";
import type { PromptSegment } from "@/lib/prompts/mentions/types";

export function ChatComposer({
  state,
  composerKey,
  onAttach,
  onSend,
  promptEnabled = true,
  className = "",
  compact = false,
}: {
  state: ChatWorkspaceState;
  composerKey: string;
  onAttach: (files: File[]) => void;
  onSend: (segments: PromptSegment[]) => void;
  promptEnabled?: boolean;
  className?: string;
  compact?: boolean;
}) {
  if (!promptEnabled) {
    return null;
  }
  const [documentEmpty, setDocumentEmpty] = useState(true);
  const [dragDepth, setDragDepth] = useState(0);
  const latestSegmentsRef = useRef<PromptSegment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = dragDepth > 0;
  const sendAllowed = canSendChat(state) && !documentEmpty;

  function addFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }
    onAttach(files);
  }

  function handleSend() {
    if (!sendAllowed) {
      return;
    }
    onSend(latestSegmentsRef.current);
    setDocumentEmpty(true);
  }

  return (
    <FadeIn index={0} className={`relative w-full text-left ${className}`}>
      <div>
        <div
          className={`flex flex-col rounded-card border bg-glass backdrop-blur-md transition ${
            compact ? "min-h-0 p-2" : "min-h-40 p-3"
          } ${
            isDragging
              ? "border-coach-muted bg-glass-focus"
              : "border-glass-border"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragDepth((current) => current + 1);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragDepth((current) => Math.max(0, current - 1));
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setDragDepth(0);
            addFiles(Array.from(event.dataTransfer.files ?? []));
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            multiple
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <PromptComposer
            key={composerKey}
            compact={compact}
            placeholder="Ask Forge to build or update a plan..."
            onDocumentChange={(segments, isEmpty) => {
              latestSegmentsRef.current = segments;
              setDocumentEmpty(isEmpty);
            }}
            onSend={(segments) => {
              if (sendAllowed) {
                onSend(segments);
                setDocumentEmpty(true);
              }
            }}
          />
          <div
            className={`flex items-center justify-between gap-2 ${compact ? "mt-1.5" : "mt-3"}`}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              icon={<PaperclipIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Attach
            </Button>
            <IconButton
              variant="primary"
              size="sm"
              icon={<ArrowRightIcon />}
              aria-label="Send"
              disabled={!sendAllowed}
              onClick={handleSend}
            />
          </div>
        </div>
      </div>
      {state.attachments.length > 0 ? (
        <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-3"}`}>
          {state.attachments.map((attachment) => (
            <ChatAttachment key={attachment.localId} attachment={attachment} />
          ))}
        </div>
      ) : null}
    </FadeIn>
  );
}
