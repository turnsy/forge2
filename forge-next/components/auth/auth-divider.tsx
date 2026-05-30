export function AuthDivider() {
  return (
    <div className="relative flex items-center">
      <div className="grow border-t border-zinc-200 dark:border-zinc-800" />
      <span className="mx-3 shrink-0 text-xs uppercase tracking-wide text-zinc-500">
        or
      </span>
      <div className="grow border-t border-zinc-200 dark:border-zinc-800" />
    </div>
  );
}
