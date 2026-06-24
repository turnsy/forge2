import type { MutableRefObject } from "react";
import type { AccordionVariant } from "@/components/ui/accordion";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import {
  AthleteExerciseHeader,
  AthleteExerciseNotes,
  AthleteSetRow,
  athleteSupersetBlockClassName,
  athleteSupersetRoundCardClassName,
  type AthleteSetFormState,
} from "@/components/plan/plan-athlete-parts";
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
import { accordionContentCardClass, accordionNestedClass } from "@/lib/theme";
import { VideoIcon } from "@/components/icons/video-icon";
import { IconButton } from "@/components/ui";

const mutedCellClass = "text-surface-muted";

export type AthleteSupersetEntryState = {
  getExercisePos: (exercisePosInBlock: number) => number;
  getSetKey: (exercisePos: number, setPos: number) => string;
  getSavedSet: (exercisePosInBlock: number, setPos: number) => Set | undefined;
  getPlannedSet: (exercisePosInBlock: number, setPos: number) => Set | undefined;
  resolveFormState: (set: Set, key: string) => AthleteSetFormState;
  isSetComplete: (set: Set) => boolean;
  isExerciseComplete?: (exercisePosInBlock: number) => boolean;
  onRepsChange: (exercisePos: number, setPos: number, set: Set, value: string) => void;
  onTargetChange: (exercisePos: number, setPos: number, set: Set, value: string) => void;
  setRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
};

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
    <div className={athleteSupersetRoundCardClassName()} data-superset-round={roundNumber}>
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

function AthleteSupersetRoundCard({
  roundNumber,
  entries,
  athleteEntry,
}: {
  roundNumber: number;
  entries: ReturnType<typeof getSupersetRounds>[number]["entries"];
  athleteEntry?: AthleteSupersetEntryState;
}) {
  const readOnly = !athleteEntry;

  return (
    <div className={athleteSupersetRoundCardClassName()} data-superset-round={roundNumber}>
      <h4 className="text-sm font-semibold text-surface-foreground">Round {roundNumber}</h4>
      <div className="space-y-4">
        {entries.map(({ exercise, exercisePosInBlock, set, setPos }) => {
          const plannedSet = athleteEntry
            ? athleteEntry.getPlannedSet(exercisePosInBlock, setPos)
            : set;
          const savedSet = athleteEntry
            ? athleteEntry.getSavedSet(exercisePosInBlock, setPos)
            : set;

          if (!plannedSet || !savedSet) {
            return null;
          }

          const exercisePos = athleteEntry?.getExercisePos(exercisePosInBlock) ?? 0;
          const key = athleteEntry?.getSetKey(exercisePos, setPos) ?? `${exercise.id}-${set.id}`;
          const values = athleteEntry
            ? athleteEntry.resolveFormState(plannedSet, key)
            : set.status === "completed"
              ? setFormStateFromActual(set)
              : { reps: "", target: "" };
          const complete = athleteEntry
            ? athleteEntry.isSetComplete(savedSet)
            : set.status === "completed";
          const exerciseComplete = athleteEntry?.isExerciseComplete?.(exercisePosInBlock) ?? false;

          return (
            <div
              key={`${exercise.id}-${set.id}`}
              className={
                exerciseComplete
                  ? [accordionNestedClass("success"), "space-y-2 !p-3"].join(" ")
                  : "space-y-2"
              }
              data-exercise-complete={exerciseComplete ? "true" : "false"}
            >
              <AthleteExerciseHeader name={exercise.name} videoUrl={exercise.videoUrl} />
              <AthleteExerciseNotes notes={exercise.notes} />
              <AthleteSetRow
                set={plannedSet}
                setIdx={setPos}
                reps={values.reps}
                target={values.target}
                readOnly={readOnly}
                complete={complete}
                setRef={
                  athleteEntry
                    ? (node) => {
                        athleteEntry.setRefs.current[key] = node;
                      }
                    : undefined
                }
                onRepsChange={
                  athleteEntry
                    ? (value) =>
                        athleteEntry.onRepsChange(exercisePos, setPos, plannedSet, value)
                    : undefined
                }
                onTargetChange={
                  athleteEntry
                    ? (value) =>
                        athleteEntry.onTargetChange(exercisePos, setPos, plannedSet, value)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlanSupersetView({
  block,
  view,
  surfaceVariant = "default",
  athleteEntry,
}: {
  block: Block;
  view: PlanViewerView;
  surfaceVariant?: AccordionVariant;
  athleteEntry?: AthleteSupersetEntryState;
}) {
  const rounds = getSupersetRounds(block);

  return (
    <section
      className={view === "athlete" ? athleteSupersetBlockClassName() : "space-y-4 rounded-lg border border-glass-border/80 bg-glass/30 p-4"}
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
              athleteEntry={athleteEntry}
            />
          ),
        )}
      </div>
    </section>
  );
}
