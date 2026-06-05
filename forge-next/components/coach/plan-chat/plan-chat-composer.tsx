"use client";

import { useRef, useState } from "react";
import { PlanChatAttachments } from "@/components/coach/plan-chat/plan-chat-attachments";
import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { PromptComposer } from "@/components/prompt/prompt-composer";
import { Button, FadeIn, IconButton } from "@/components/ui";
import { canSendPlanChat } from "@/lib/plan-chat/workspace-selectors";
import type { PlanChatWorkspaceState } from "@/lib/plan-chat/types";
import type { PromptMentionItem, PromptSegment } from "@/lib/prompts/mention-types";

export function PlanChatComposer({
  state,
  mentionItems,
  composerKey,
  onAttach,
  onSend,
  className = "",
}: {
  state: PlanChatWorkspaceState;
  mentionItems: PromptMentionItem[];
  composerKey: string;
  onAttach: (files: File[]) => void;
  onSend: (segments: PromptSegment[]) => void;
  className?: string;
}) {
  const [documentEmpty, setDocumentEmpty] = useState(true);
  const [dragDepth, setDragDepth] = useState(0);
  const latestSegmentsRef = useRef<PromptSegment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = dragDepth > 0;
  const sendAllowed = canSendPlanChat(state) && !documentEmpty;

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
          className={`flex min-h-40 flex-col rounded-card border bg-glass p-3 shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md transition ${
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
            mentionItems={mentionItems}
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
          <div className="mt-3 flex items-center justify-between gap-2">
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
      <div className="mt-3">
        <PlanChatAttachments attachments={state.attachments} />
      </div>
    </FadeIn>
  );
}
