import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-surface-divider px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-surface-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-surface-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
