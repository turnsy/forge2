import type { Block } from "@/lib/plans/workout-plan";

export function BlockHeader({
  block,
  isSuperset,
}: {
  block: Block;
  isSuperset: boolean;
}) {
  if (!isSuperset && !block.label?.trim() && !block.notes?.trim()) {
    return null;
  }

  return (
    <>
      {isSuperset ? (
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-glass-border/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-surface-muted">
            Superset
          </span>
          {block.label ? (
            <h3 className="text-sm font-medium text-surface-muted">{block.label}</h3>
          ) : null}
        </div>
      ) : block.label ? (
        <h3 className="text-sm font-medium text-surface-muted">{block.label}</h3>
      ) : null}
      {block.notes ? (
        <p className="text-sm text-surface-muted">{block.notes}</p>
      ) : null}
    </>
  );
}
