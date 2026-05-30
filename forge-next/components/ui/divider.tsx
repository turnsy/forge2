import { dividerLineClass } from "@/lib/theme";

export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative flex items-center">
      <div className={dividerLineClass()} />
      <span className="mx-3 shrink-0 text-xs uppercase tracking-wide text-surface-muted">
        {label}
      </span>
      <div className={dividerLineClass()} />
    </div>
  );
}
