export function Spinner({
  className = "h-8 w-8",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`animate-spin rounded-full border-2 border-glass-border border-t-surface-foreground ${className}`}
    />
  );
}
