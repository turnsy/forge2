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
    <header className="shrink-0 px-4 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          type="text"
          value={planTitle}
          placeholder="Plan title"
          aria-label="Plan title"
          onChange={(event) => onPlanTitleChange(event.target.value)}
          className="min-w-0 flex-1 text-lg font-semibold"
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
