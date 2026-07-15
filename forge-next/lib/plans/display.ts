import type {
  AbsoluteLoad,
  ActualSet,
  SetTarget,
  PercentageLoad,
  PlannedSet,
  RepsValue,
  Set,
  Week,
  Day,
} from "@/lib/plans/workout-plan";
import { computePrescribedWeight } from "@/lib/maxes/compute-weight";
import type { MaxValue } from "@/lib/maxes/compute-weight";

export function formatReps(reps: RepsValue): string {
  return String(reps);
}

export function formatTarget(load: SetTarget): string {
  if (load.type === "absolute") {
    return formatAbsoluteTarget(load);
  }

  return formatPercentageTarget(load);
}

function formatAbsoluteTarget(load: AbsoluteLoad): string {
  return `${load.value} ${load.unit}`;
}

export function formatPercentageTarget(load: PercentageLoad): string {
  return `${load.value}% (${load.unit})`;
}

export function formatResolvedPercentageTarget(
  load: PercentageLoad,
  max: MaxValue | null,
): string {
  const weight = computePrescribedWeight(max, load.value, load.unit);
  return weight === null
    ? formatPercentageTarget(load)
    : `${weight} ${load.unit} (${load.value}%)`;
}

export function formatTargetInstruction(instruction: string): string {
  return instruction;
}

export function getWeekTitle(week: Week, weekPos: number): string {
  if (week.label?.trim()) {
    return week.label.trim();
  }

  if (week.name?.trim()) {
    return week.name.trim();
  }

  return `Week ${weekPos + 1}`;
}

export function getDayTitle(day: Day, dayPos: number): string {
  if (day.name?.trim()) {
    return day.name.trim();
  }

  return `Day ${dayPos + 1}`;
}

export const EMPTY_CELL = "—";

export function formatOptionalCell(value: string | undefined): string {
  if (!value?.trim()) {
    return EMPTY_CELL;
  }

  return value.trim();
}

export function getSetNotes(set: Set): string | undefined {
  if (set.planned.type === "exact" || set.planned.type === "target") {
    const notes = set.planned.notes ?? set.notes;
    return notes?.trim() || undefined;
  }

  return set.notes?.trim() || undefined;
}

function getPlannedReps(planned: PlannedSet): RepsValue | undefined {
  return planned.reps;
}

function getPlannedTarget(planned: PlannedSet): SetTarget | undefined {
  return planned.target;
}

export function actualRepsMatchesPlanned(
  planned: PlannedSet,
  actual: ActualSet,
): boolean | null {
  if (actual.reps === undefined || actual.reps === "") {
    return null;
  }

  const plannedReps = getPlannedReps(planned);
  if (plannedReps === undefined) {
    return null;
  }

  return String(plannedReps) === String(actual.reps);
}

export function actualTargetMatchesPlanned(
  planned: PlannedSet,
  actual: ActualSet,
): boolean | null {
  if (!actual.target) {
    return null;
  }

  const plannedTarget = getPlannedTarget(planned);
  if (!plannedTarget) {
    return null;
  }

  if (plannedTarget.type === "percentage") {
    return true;
  }

  if (actual.target.type !== "absolute" || plannedTarget.type !== "absolute") {
    return false;
  }

  return (
    plannedTarget.value === actual.target.value && plannedTarget.unit === actual.target.unit
  );
}

export type CoachSetCells = {
  reps: string;
  target: string;
  notes: string;
};

export function formatCoachSetCells(set: Set): CoachSetCells {
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

export function formatPlannedSetBrief(set: Set): string {
  const planned = set.planned;
  const parts: string[] = [formatPlannedSetCore(planned)];

  const notes = planned.notes?.trim();
  if (notes) {
    parts.push(`[${notes}]`);
  }

  if (set.status !== "planned") {
    parts.push(`(${set.status})`);
  }

  return parts.join(" ");
}

export function formatExerciseSetsSummary(sets: Set[]): string {
  if (sets.length === 0) {
    return "";
  }

  const formatted = sets.map((set) => formatPlannedSetBrief(set));
  const allIdentical = formatted.length > 1 && formatted.every((line) => line === formatted[0]);

  if (allIdentical) {
    return `${sets.length}× ${formatted[0]}`;
  }

  return formatted.join(", ");
}

function formatPlannedSetCore(planned: PlannedSet): string {
  if (planned.type === "target") {
    const parts = [formatTargetInstruction(planned.instruction)];
    if (planned.reps !== undefined) {
      parts.push(`${formatReps(planned.reps)} reps`);
    }
    if (planned.target) {
      parts.push(`@ ${formatTarget(planned.target)}`);
    }
    return parts.join(" ");
  }

  return `${formatReps(planned.reps)} @ ${formatTarget(planned.target)}`;
}
