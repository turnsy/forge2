"use client";

import { Button, Input } from "@/components/ui";
import type { SavePlanStatus } from "@/lib/plans/use-save-plan";

function getSaveButtonLabel(saveStatus: SavePlanStatus): string {
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
}: {
  title: string;
  saveDisabled: boolean;
  saveStatus?: SavePlanStatus;
  onTitleChange: (value: string) => void;
  onSave?: () => void;
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
        </div>
      </div>
    </header>
  );
}
