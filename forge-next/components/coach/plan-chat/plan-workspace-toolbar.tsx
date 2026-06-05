"use client";

import { Button, Input } from "@/components/ui";

export function PlanWorkspaceToolbar({
  planTitle,
  saveDisabled,
  onPlanTitleChange,
}: {
  planTitle: string;
  saveDisabled: boolean;
  onPlanTitleChange: (value: string) => void;
}) {
  return (
    <header className="shrink-0">
      <div className="flex items-center justify-between gap-3">
        <Input
          type="text"
          size="sm"
          value={planTitle}
          placeholder="Plan title"
          aria-label="Plan title"
          onChange={(event) => onPlanTitleChange(event.target.value)}
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
