import { VideoIcon } from "@/components/icons/video-icon";
import type { AccordionVariant } from "@/components/ui/accordion";
import { IconButton, Input } from "@/components/ui";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import {
  EMPTY_CELL,
  actualRepsMatchesPlanned,
  actualTargetMatchesPlanned,
  formatOptionalCell,
  formatReps,
  formatTarget,
  formatTargetInstruction,
} from "@/lib/plans/display";
import { getSupersetRounds } from "@/lib/plans/day-blocks";
import { setFormStateFromActual } from "@/lib/athlete/plan/domain";
import type { Block, Set } from "@/lib/plans/workout-plan";
import { accordionContentCardClass } from "@/lib/theme";

const mutedCellClass = "text-surface-muted";
const roundCardClass =
  "space-y-3 rounded-lg border border-glass-border/80 bg-glass/40 p-4";

function PrescribedActualCell({
  prescribed,
  actualValue,
  matches,
}: {
  prescribed: string;
  actualValue: string | null;
  matches: boolean | null;
}) {
  if (!actualValue) {
    return <span>{prescribed}</span>;
  }

  const actualClass =
    matches === true
      ? "font-bold text-emerald-700 dark:text-emerald-300"
      : matches === false
        ? "font-bold text-amber-800 dark:text-amber-200"
        : "font-bold text-surface-foreground";

  return (
    <div className="flex flex-col gap-0.5 md:inline-flex md:flex-row md:items-baseline md:gap-1">
      <span>{prescribed}</span>
      <span className={actualClass}>({actualValue})</span>
    </div>
  );
}

function formatCoachSetCells(set: Set): { reps: string; target: string; notes: string } {
  const { planned } = set;

  if (planned.type === "exact") {
    return {
      reps: formatReps(planned.reps),
      target: formatTarget(planned.target),
      notes: formatOptionalCell(planned.notes ?? set.notes),
    };
  }

  return {
    reps: formatTargetInstruction(planned.instruction),
    target: planned.target ? formatTarget(planned.target) : EMPTY_CELL,
    notes: formatOptionalCell(planned.notes ?? set.notes),
  };
}

function CoachSupersetRoundTable({
  roundNumber,
  entries,
  surfaceVariant,
}: {
  roundNumber: number;
  entries: ReturnType<typeof getSupersetRounds>[number]["entries"];
  surfaceVariant: AccordionVariant;
}) {
  return (
    <div className={roundCardClass} data-superset-round={roundNumber}>
      <h4 className="text-sm font-semibold text-surface-foreground">Round {roundNumber}</h4>
      <div className={accordionContentCardClass(surfaceVariant)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-glass-border text-left text-xs font-medium uppercase tracking-wide text-surface-foreground/80">
                <th className="px-3 py-2 font-medium">Exercise</th>
                <th className="px-3 py-2 font-medium">Reps</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ exercise, set }) => {
                const row = formatCoachSetCells(set);
                const showActual = set.status !== "skipped" && set.actual !== null;
                const actualReps =
                  showActual &&
                  set.actual?.reps !== undefined &&
                  set.actual.reps !== ""
                    ? set.actual.reps
                    : null;
                const actualTarget = showActual ? (set.actual?.target ?? null) : null;

                return (
                  <tr key={`${exercise.id}-${set.id}`} className="border-b border-glass-border/60 last:border-b-0">
                    <td className="px-3 py-2 font-medium text-surface-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span>{exercise.name}</span>
                        {exercise.videoUrl ? (
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<VideoIcon className="h-4 w-4" />}
                            aria-label="Watch exercise video"
                            onClick={() =>
                              window.open(exercise.videoUrl, "_blank", "noopener,noreferrer")
                            }
                          />
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
    </div>
  );
}

function AthleteSupersetReadOnlySetRow({ set }: { set: Set }) {
  const filled = set.status === "completed";
  const values = filled ? setFormStateFromActual(set) : { reps: "", target: "" };

  if (set.planned.type === "target") {
    return (
      <p className="text-sm text-surface-muted">{set.planned.instruction}</p>
    );
  }

  const unit =
    set.planned.target.type === "absolute" || set.planned.target.type === "percentage"
      ? set.planned.target.unit
      : null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Input
        aria-label="Set reps"
        type="text"
        value={values.reps}
        placeholder={String(set.planned.reps)}
        readOnly
        className="w-16"
        size="sm"
      />
      <span className="shrink-0 text-surface-muted">of</span>
      <Input
        aria-label="Set target"
        type="text"
        value={values.target}
        placeholder={formatTarget(set.planned.target)}
        readOnly
        className="w-16"
        size="sm"
      />
      {unit ? <span className="shrink-0 text-surface-muted">{unit}</span> : null}
    </div>
  );
}

function AthleteSupersetRoundCard({
  roundNumber,
  entries,
}: {
  roundNumber: number;
  entries: ReturnType<typeof getSupersetRounds>[number]["entries"];
}) {
  return (
    <div className={roundCardClass} data-superset-round={roundNumber}>
      <h4 className="text-sm font-semibold text-surface-foreground">Round {roundNumber}</h4>
      <div className="space-y-4">
        {entries.map(({ exercise, set }) => (
          <div key={`${exercise.id}-${set.id}`} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-base font-semibold text-surface-foreground">{exercise.name}</h5>
              {exercise.videoUrl ? (
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<VideoIcon className="h-4 w-4" />}
                  aria-label="Watch exercise video"
                  onClick={() =>
                    window.open(exercise.videoUrl, "_blank", "noopener,noreferrer")
                  }
                />
              ) : null}
            </div>
            {exercise.notes ? (
              <p className="text-sm text-surface-muted">{exercise.notes}</p>
            ) : null}
            <AthleteSupersetReadOnlySetRow set={set} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanSupersetView({
  block,
  view,
  surfaceVariant = "default",
}: {
  block: Block;
  view: PlanViewerView;
  surfaceVariant?: AccordionVariant;
}) {
  const rounds = getSupersetRounds(block);

  return (
    <section
      className="space-y-4 rounded-lg border border-glass-border/80 bg-glass/30 p-4"
      data-plan-block
      data-superset="true"
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-glass-border/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-surface-muted">
          Superset
        </span>
        {block.label ? (
          <h3 className="text-sm font-medium text-surface-muted">{block.label}</h3>
        ) : null}
      </div>
      {block.notes ? (
        <p className="text-sm text-surface-muted">{block.notes}</p>
      ) : null}
      <div className="space-y-4">
        {rounds.map((round) =>
          view === "coach" ? (
            <CoachSupersetRoundTable
              key={round.roundNumber}
              roundNumber={round.roundNumber}
              entries={round.entries}
              surfaceVariant={surfaceVariant}
            />
          ) : (
            <AthleteSupersetRoundCard
              key={round.roundNumber}
              roundNumber={round.roundNumber}
              entries={round.entries}
            />
          ),
        )}
      </div>
    </section>
  );
}
