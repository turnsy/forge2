export function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-surface-muted">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-surface-foreground">
        {value}
      </dd>
    </div>
  );
}
