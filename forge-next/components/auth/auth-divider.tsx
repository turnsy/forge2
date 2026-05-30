export function AuthDivider() {
  return (
    <div className="relative flex items-center">
      <div className="grow border-t border-surface-divider" />
      <span className="mx-3 shrink-0 text-xs uppercase tracking-wide text-surface-muted">
        or
      </span>
      <div className="grow border-t border-surface-divider" />
    </div>
  );
}
