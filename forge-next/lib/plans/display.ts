import type {
  AbsoluteLoad,
  ActualSet,
  Load,
  PercentageLoad,
  PlannedSet,
  RepsValue,
  Week,
  Day,
} from "@/lib/plans/workout-plan";

export function formatReps(reps: RepsValue): string {
  return String(reps);
}

export function formatLoad(load: Load): string {
  if (load.type === "absolute") {
    return formatAbsoluteLoad(load);
  }

  return formatPercentageLoad(load);
}

function formatAbsoluteLoad(load: AbsoluteLoad): string {
  return `${load.value} ${load.unit}`;
}

export function formatPercentageLoad(load: PercentageLoad): string {
  switch (load.operator) {
    case "exact":
      return `${load.value}%`;
    case "at-least":
      return `≥${load.value}%`;
    case "at-most":
      return `≤${load.value}%`;
    case "range":
      return `${load.minValue}–${load.maxValue}%`;
    default:
      return "%";
  }
}

export function formatTargetInstruction(instruction: string): string {
  return instruction;
}

export function getWeekTitle(week: Week): string {
  if (week.label?.trim()) {
    return week.label.trim();
  }

  if (week.name?.trim()) {
    return week.name.trim();
  }

  return `Week ${week.index}`;
}

export function getDayTitle(day: Day): string {
  if (day.name?.trim()) {
    return day.name.trim();
  }

  return `Day ${day.index}`;
}

export const EMPTY_CELL = "—";

export function formatOptionalCell(value: string | undefined): string {
  if (!value?.trim()) {
    return EMPTY_CELL;
  }

  return value.trim();
}

function getPlannedReps(planned: PlannedSet): RepsValue | undefined {
  return planned.reps;
}

function getPlannedLoad(planned: PlannedSet): Load | undefined {
  return planned.load;
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

export function actualLoadMatchesPlanned(
  planned: PlannedSet,
  actual: ActualSet,
): boolean | null {
  if (!actual.load) {
    return null;
  }

  const plannedLoad = getPlannedLoad(planned);
  if (!plannedLoad) {
    return null;
  }

  if (plannedLoad.type === "percentage") {
    return true;
  }

  if (actual.load.type !== "absolute" || plannedLoad.type !== "absolute") {
    return false;
  }

  return (
    plannedLoad.value === actual.load.value && plannedLoad.unit === actual.load.unit
  );
}
