export function Separator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={className ?? "my-1 border-t border-glass-border"}
    />
  );
}
