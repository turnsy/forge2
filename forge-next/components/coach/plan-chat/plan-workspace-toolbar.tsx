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
    <div className="flex shrink-0 items-center gap-3 px-1">
      <Input
        type="text"
        value={planTitle}
        placeholder="Plan title"
        aria-label="Plan title"
        onChange={(event) => onPlanTitleChange(event.target.value)}
        className="min-w-0 flex-1 text-lg font-semibold"
      />
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
  );
}
