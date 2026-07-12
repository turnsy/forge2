"use client";

import { XIcon } from "@/components/icons/x-icon";
import { Button, IconButton, Input } from "@/components/ui";
import type { SaveArtifactStatus } from "@/lib/chat/use-save-artifact";

function getSaveButtonLabel(saveStatus: SaveArtifactStatus): string {
  switch (saveStatus) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    default:
      return "Save";
  }
}

export function ArtifactToolbar({
  title,
  saveDisabled,
  saveStatus = "idle",
  onTitleChange,
  onSave,
  onClose,
  closeAriaLabel = "Close artifact",
}: {
  title: string;
  saveDisabled: boolean;
  saveStatus?: SaveArtifactStatus;
  onTitleChange: (value: string) => void;
  onSave?: () => void;
  onClose?: () => void;
  closeAriaLabel?: string;
}) {
  const saveButtonDisabled =
    saveDisabled || saveStatus === "saving" || saveStatus === "saved";
  return (
    <header className="shrink-0">
      <div className="flex items-center justify-between gap-3">
        <Input
          type="text"
          size="sm"
          value={title}
          placeholder="Title"
          aria-label="Artifact title"
          onChange={(event) => onTitleChange(event.target.value)}
          className="min-w-0 flex-1 font-semibold"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            disabled={saveButtonDisabled}
            onClick={onSave}
          >
            {getSaveButtonLabel(saveStatus)}
          </Button>
          {onClose ? (
            <IconButton
              type="button"
              variant="secondary"
              size="sm"
              icon={<XIcon />}
              aria-label={closeAriaLabel}
              onClick={onClose}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
