"use client";

import { useRef, useState } from "react";
import { ChatAttachment } from "@/components/chat/chat-attachment";
import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { RotateIcon } from "@/components/icons/rotate-icon";
import { StopIcon } from "@/components/icons/stop-icon";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { PromptComposer } from "@/components/prompt/prompt-composer";
import { Button, FadeIn, IconButton } from "@/components/ui";
import { canSendChat, canStopChat } from "@/lib/chat/workspace-selectors";
import type { ChatWorkspaceState } from "@/lib/chat/types";
import type { PromptSegment } from "@/lib/prompts/mentions/types";

export function ChatComposer({
  state,
  composerKey,
  onAttach,
  onSend,
  onStop,
  onReset,
  promptEnabled = true,
  className = "",
  compact = false,
}: {
  state: ChatWorkspaceState;
  composerKey: string;
  onAttach: (files: File[]) => void;
  onSend: (segments: PromptSegment[]) => void;
  onStop?: () => void;
  onReset?: () => void;
  promptEnabled?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const [documentEmpty, setDocumentEmpty] = useState(true);
  const [dragDepth, setDragDepth] = useState(0);
  const latestSegmentsRef = useRef<PromptSegment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!promptEnabled) {
    return null;
  }

  const isDragging = dragDepth > 0;
  const isInitializing = state.phase === "initializing";
  const sendAllowed = canSendChat(state) && !documentEmpty;
  const stopAllowed =
    canStopChat(state) && Boolean(onStop) && !sendAllowed;

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
            <div className="flex items-center gap-1">
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
              {onReset ? (
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<RotateIcon />}
                  aria-label="Reset conversation"
                  onClick={onReset}
                />
              ) : null}
            </div>
            <IconButton
              variant="primary"
              size="sm"
              icon={
                stopAllowed ? (
                  <StopIcon className="h-3 w-3" />
                ) : isInitializing ? (
                  <span
                    aria-hidden
                    className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current"
                  />
                ) : (
                  <ArrowRightIcon />
                )
              }
              aria-label={
                stopAllowed
                  ? "Stop response"
                  : isInitializing
                    ? "Starting conversation"
                    : "Send"
              }
              disabled={!stopAllowed && !sendAllowed && !isInitializing}
              onClick={stopAllowed ? onStop : handleSend}
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
