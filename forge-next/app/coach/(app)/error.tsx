"use client";

import { PageContent, PageHeader, Button } from "@/components/ui";

export default function CoachAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContent
      header={<PageHeader title="Something went wrong" />}
    >
      <div className="rounded-card border border-danger-border bg-danger-muted p-4 text-sm text-danger">
        {error.message || "An unexpected error occurred."}
      </div>
      <div>
        <Button type="button" variant="secondary" fullWidth={false} onClick={reset}>
          Try again
        </Button>
      </div>
    </PageContent>
  );
}
