import type { Set } from "@/lib/plans/workout-plan";
import type { AccordionVariant } from "@/components/ui/accordion";
import { PrescribedActualCell } from "@/components/plan/prescribed-actual-cell";
import {
  EMPTY_CELL,
  actualTargetMatchesPlanned,
  actualRepsMatchesPlanned,
  formatCoachSetCells,
  formatTarget,
  formatReps,
} from "@/lib/plans/display";
import { accordionContentCardClass } from "@/lib/theme";

export type PlanViewerView = "coach" | "athlete";

const mutedCellClass = "text-surface-muted";

type CoachSetRow = {
  setNumber: number;
  reps: string;
  target: string;
  notes: string;
};

function buildCoachSetRow(set: Set, setNumber: number): CoachSetRow {
  return {
    setNumber,
    ...formatCoachSetCells(set),
  };
}

function SetStatusPill({ status }: { status: "completed" | "skipped" }) {
  const baseClass =
    "inline-flex rounded-full px-1.5 py-px text-[10px] font-medium leading-tight md:px-2 md:py-0.5 md:text-xs";

  if (status === "completed") {
    return (
      <span
        className={`${baseClass} border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`}
      >
        Completed
      </span>
    );
  }

  return (
    <span
      className={`${baseClass} border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200`}
    >
      Skipped
    </span>
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
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ set, row }) => {
              const showActual =
                set.status !== "skipped" && set.actual !== null;
              const actualReps =
                showActual &&
                set.actual?.reps !== undefined &&
                set.actual.reps !== ""
                  ? set.actual.reps
                  : null;
              const actualTarget = showActual ? (set.actual?.target ?? null) : null;

              return (
                <tr key={set.id} className="border-b border-glass-border/60 last:border-b-0">
                  <td className="px-3 py-2 font-medium text-surface-foreground">
                    <div className="flex flex-col items-start gap-1 md:flex-row md:flex-wrap md:items-center md:gap-2">
                      <span className="hidden md:inline">{row.setNumber}</span>
                      {set.status === "completed" ? (
                        <SetStatusPill status="completed" />
                      ) : null}
                      {set.status === "skipped" ? (
                        <SetStatusPill status="skipped" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-surface-foreground">
                    <PrescribedActualCell
                      prescribed={row.reps}
                      actualValue={
                        actualReps !== null ? formatReps(actualReps) : null
                      }
                      matches={
                        actualReps !== null && set.actual
                          ? actualRepsMatchesPlanned(set.planned, set.actual)
                          : null
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-surface-foreground">
                    <PrescribedActualCell
                      prescribed={row.target}
                      actualValue={actualTarget ? formatTarget(actualTarget) : null}
                      matches={
                        actualTarget && set.actual
                          ? actualTargetMatchesPlanned(set.planned, set.actual)
                          : null
                      }
                    />
                  </td>
                  <td
                    className={`px-3 py-2 ${row.notes === EMPTY_CELL ? mutedCellClass : "text-surface-foreground"}`}
                  >
                    {row.notes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
