import type { Set } from "@/lib/plans/workout-plan";
import { Fragment } from "react";
import type { AccordionVariant } from "@/components/ui/accordion";
import {
  EMPTY_CELL,
  formatLoad,
  formatOptionalCell,
  formatReps,
  formatTargetInstruction,
} from "@/lib/plans/display";
import { accordionContentCardClass } from "@/lib/theme";

export type PlanViewerView = "coach" | "athlete";

const mutedCellClass = "text-surface-muted";

type CoachSetRow = {
  setNumber: number;
  reps: string;
  load: string;
  notes: string;
};

function buildCoachSetRow(set: Set, setNumber: number): CoachSetRow {
  const { planned } = set;

  if (planned.type === "exact") {
    return {
      setNumber,
      reps: formatReps(planned.reps),
      load: formatLoad(planned.load),
      notes: formatOptionalCell(planned.notes ?? set.notes),
    };
  }

  return {
    setNumber,
    reps: formatTargetInstruction(planned.instruction),
    load: planned.load ? formatLoad(planned.load) : EMPTY_CELL,
    notes: formatOptionalCell(planned.notes ?? set.notes),
  };
}

function formatSetActualSummary(set: Set): string | null {
  if (!set.actual) {
    return null;
  }

  const parts: string[] = [];

  if (set.actual.reps !== undefined && set.actual.reps !== "") {
    parts.push(`${formatReps(set.actual.reps)} reps`);
  }

  if (set.actual.load) {
    parts.push(formatLoad(set.actual.load));
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function CoachSetActualRow({ set }: { set: Set }) {
  const actualSummary = formatSetActualSummary(set);

  if (set.status === "planned" && !actualSummary) {
    return null;
  }

  return (
    <tr className="border-b border-glass-border/40 last:border-b-0">
      <td colSpan={4} className="px-3 pb-2 pt-0 text-xs text-surface-muted">
        <div className="flex flex-wrap items-center gap-2 pl-6">
          {set.status === "skipped" ? (
            <span>Skipped</span>
          ) : actualSummary ? (
            <span>Actual: {actualSummary}</span>
          ) : null}
          {set.status === "completed" ? (
            <span aria-label="Completed" title="Completed">
              ✓
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function PlanSetTable({
  sets,
  view,
  surfaceVariant = "default",
}: {
  sets: Set[];
  view: PlanViewerView;
  surfaceVariant?: AccordionVariant;
}) {
  if (view !== "coach") {
    return null;
  }

  const rows = sets.map((set, index) => ({
    set,
    row: buildCoachSetRow(set, index + 1),
  }));

  return (
    <div className={accordionContentCardClass(surfaceVariant)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-glass-border text-left text-xs font-medium uppercase tracking-wide text-surface-foreground/80">
              <th className="px-3 py-2 font-medium">Set</th>
              <th className="px-3 py-2 font-medium">Reps</th>
              <th className="px-3 py-2 font-medium">Load</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ set, row }) => (
              <Fragment key={set.id}>
                <tr className="border-b border-glass-border/60">
                  <td className="px-3 py-2 font-medium text-surface-foreground">
                    {row.setNumber}
                  </td>
                  <td className="px-3 py-2 text-surface-foreground">{row.reps}</td>
                  <td className="px-3 py-2 text-surface-foreground">{row.load}</td>
                  <td
                    className={`px-3 py-2 ${row.notes === EMPTY_CELL ? mutedCellClass : "text-surface-foreground"}`}
                  >
                    {row.notes}
                  </td>
                </tr>
                <CoachSetActualRow set={set} />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
