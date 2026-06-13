import type { ReactNode } from "react";

export function MetaItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-surface-muted">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 text-sm font-medium text-surface-foreground">
        {value}
      </dd>
    </div>
  );
}
