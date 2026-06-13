import type { Set } from "@/lib/plans/workout-plan";
import type { AccordionVariant } from "@/components/ui/accordion";
import {
  EMPTY_CELL,
  actualLoadMatchesPlanned,
  actualRepsMatchesPlanned,
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

function SetStatusPill({ status }: { status: "completed" | "skipped" }) {
  const baseClass =
    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium";

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

function actualValueClass(matches: boolean | null): string {
  if (matches === true) {
    return "font-bold text-emerald-700 dark:text-emerald-300";
  }

  if (matches === false) {
    return "font-bold text-amber-800 dark:text-amber-200";
  }

  return "font-bold text-surface-foreground";
}

function ActualInlineValue({
  value,
  matches,
}: {
  value: string;
  matches: boolean | null;
}) {
  return (
    <>
      {" "}
      <span className={actualValueClass(matches)}>({value})</span>
    </>
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
            {rows.map(({ set, row }) => {
              const showActual =
                set.status !== "skipped" && set.actual !== null;
              const actualReps =
                showActual &&
                set.actual?.reps !== undefined &&
                set.actual.reps !== ""
                  ? set.actual.reps
                  : null;
              const actualLoad = showActual ? (set.actual?.load ?? null) : null;

              return (
                <tr key={set.id} className="border-b border-glass-border/60 last:border-b-0">
                  <td className="px-3 py-2 font-medium text-surface-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{row.setNumber}</span>
                      {set.status === "completed" ? (
                        <SetStatusPill status="completed" />
                      ) : null}
                      {set.status === "skipped" ? (
                        <SetStatusPill status="skipped" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-surface-foreground">
                    <span>{row.reps}</span>
                    {actualReps !== null && set.actual ? (
                      <ActualInlineValue
                        value={formatReps(actualReps)}
                        matches={actualRepsMatchesPlanned(set.planned, set.actual)}
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-surface-foreground">
                    <span>{row.load}</span>
                    {actualLoad && set.actual ? (
                      <ActualInlineValue
                        value={formatLoad(actualLoad)}
                        matches={actualLoadMatchesPlanned(set.planned, set.actual)}
                      />
                    ) : null}
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
