import type { Set } from "@/lib/plans/workout-plan";
import {
  EMPTY_CELL,
  formatLoad,
  formatOptionalCell,
  formatReps,
  formatRestSeconds,
  formatTargetInstruction,
} from "@/lib/plans/display";

export type PlanViewerView = "coach" | "athlete";

const mutedCellClass = "text-surface-muted";

type CoachSetRow = {
  setNumber: number;
  reps: string;
  load: string;
  tempo: string;
  rest: string;
  notes: string;
};

function buildCoachSetRow(set: Set, setNumber: number): CoachSetRow {
  const { planned } = set;

  if (planned.type === "exact") {
    return {
      setNumber,
      reps: formatReps(planned.reps),
      load: formatLoad(planned.load),
      tempo: formatOptionalCell(planned.tempo),
      rest:
        planned.restSeconds !== undefined
          ? formatRestSeconds(planned.restSeconds)
          : EMPTY_CELL,
      notes: formatOptionalCell(planned.notes ?? set.notes),
    };
  }

  return {
    setNumber,
    reps: formatTargetInstruction(planned.instruction),
    load: planned.load ? formatLoad(planned.load) : EMPTY_CELL,
    tempo: EMPTY_CELL,
    rest: EMPTY_CELL,
    notes: formatOptionalCell(planned.notes ?? set.notes),
  };
}

export function PlanSetTable({
  sets,
  view,
}: {
  sets: Set[];
  view: PlanViewerView;
}) {
  if (view !== "coach") {
    return null;
  }

  const rows = sets.map((set, index) => buildCoachSetRow(set, index + 1));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-glass-border text-left text-xs font-medium uppercase tracking-wide text-surface-muted">
            <th className="px-3 py-2 font-medium">Set</th>
            <th className="px-3 py-2 font-medium">Reps</th>
            <th className="px-3 py-2 font-medium">Load</th>
            <th className="px-3 py-2 font-medium">Tempo</th>
            <th className="px-3 py-2 font-medium">Rest</th>
            <th className="px-3 py-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.setNumber}
              className="border-b border-glass-border/60 last:border-b-0"
            >
              <td className="px-3 py-2 font-medium text-surface-foreground">
                {row.setNumber}
              </td>
              <td className="px-3 py-2 text-surface-foreground">{row.reps}</td>
              <td className="px-3 py-2 text-surface-foreground">{row.load}</td>
              <td className={`px-3 py-2 ${row.tempo === EMPTY_CELL ? mutedCellClass : "text-surface-foreground"}`}>
                {row.tempo}
              </td>
              <td className={`px-3 py-2 ${row.rest === EMPTY_CELL ? mutedCellClass : "text-surface-foreground"}`}>
                {row.rest}
              </td>
              <td className={`px-3 py-2 ${row.notes === EMPTY_CELL ? mutedCellClass : "text-surface-foreground"}`}>
                {row.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
