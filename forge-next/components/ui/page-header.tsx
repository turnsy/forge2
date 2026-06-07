import type { ReactNode } from "react";

export function PageHeader({
  title,
  titleAddon,
  description,
  actions,
}: {
  title: string;
  titleAddon?: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-1">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="text-2xl font-semibold text-surface-foreground">{title}</h1>
          {titleAddon}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm text-surface-muted">{description}</p>
      ) : null}
    </header>
  );
}
