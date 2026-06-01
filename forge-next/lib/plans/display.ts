import type {
  AbsoluteLoad,
  Load,
  PercentageLoad,
  RepsValue,
  Week,
  Day,
} from "@/lib/plans/workout-plan";

export function formatReps(reps: RepsValue): string {
  return String(reps);
}

function formatBasis(basis: string): string {
  return basis.replace(/_/g, " ");
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
  const basis = formatBasis(load.basis);

  switch (load.operator) {
    case "exact":
      return `${load.value}% ${basis}`;
    case "at-least":
      return `≥${load.value}% ${basis}`;
    case "at-most":
      return `≤${load.value}% ${basis}`;
    case "range":
      return `${load.minValue}–${load.maxValue}% ${basis}`;
    default:
      return `${basis}`;
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

  return day.code;
}

export function formatRestSeconds(seconds: number): string {
  return `${seconds}s`;
}

export const EMPTY_CELL = "—";

export function formatOptionalCell(value: string | undefined): string {
  if (!value?.trim()) {
    return EMPTY_CELL;
  }

  return value.trim();
}
