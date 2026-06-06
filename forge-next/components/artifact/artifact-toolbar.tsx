"use client";

import { Button, Input } from "@/components/ui";

export function ArtifactToolbar({
  title,
  saveDisabled,
  onTitleChange,
}: {
  title: string;
  saveDisabled: boolean;
  onTitleChange: (value: string) => void;
}) {
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
            disabled={saveDisabled}
          >
            Save
          </Button>
        </div>
      </div>
    </header>
  );
}
