import { flattenDayExercises, isSupersetBlock } from "@/lib/plans/day-blocks";
import {
  formatReps,
  formatTarget,
  formatTargetInstruction,
  getDayTitle,
  getWeekTitle,
} from "@/lib/plans/display";
import type { Exercise, PlannedSet, Set, WorkoutPlan } from "@/lib/plans/workout-plan";
import { getPlanStats } from "@/lib/plans/stats";

export type SummarizePlanOptions = {
  /** 0-based week index (same as plan.week(n)). */
  week?: number;
  /** 0-based day index within the week. Requires week. Adds set breakdown when both are set. */
  day?: number;
};

/**
 * Compact text summary for plan-chat iterations. Never includes full artifact JSON.
 */
export function summarizePlan(
  plan: WorkoutPlan | null | undefined,
  options?: SummarizePlanOptions,
): string {
  if (!plan?.weeks?.length) {
    return "No existing plan (empty seed).";
  }

  if (options?.day !== undefined && options.week === undefined) {
    return "day requires week (0-based indices, same as plan.week(n).day(m)).";
  }

  if (options?.week !== undefined) {
    const week = plan.weeks[options.week];
    if (!week) {
      return `Week index ${options.week} out of range (plan has ${plan.weeks.length} week(s)).`;
    }

    if (options.day !== undefined) {
      const day = week.days?.[options.day];
      if (!day) {
        const dayCount = week.days?.length ?? 0;
        return `Day index ${options.day} out of range (week ${options.week} has ${dayCount} day(s)).`;
      }

      return summarizeDayDetail(plan, options.week, options.day, week, day);
    }

    return summarizeWeekDetail(plan, options.week, week);
  }

  return summarizePlanOverview(plan);
}

function summarizePlanOverview(plan: WorkoutPlan): string {
  const { weekCount, daysPerWeek } = getPlanStats(plan);
  const lines: string[] = [
    `Plan: ${plan.name}`,
    `Schema: ${plan.schemaVersion}`,
    `Weeks: ${weekCount}, days per week: ${daysPerWeek}`,
  ];

  if (plan.discipline) {
    lines.push(`Discipline: ${plan.discipline}`);
  }

  plan.weeks.slice(0, 8).forEach((week, weekPos) => {
    const dayCount = week.days?.length ?? 0;
    const weekLabel = getWeekTitle(week, weekPos);
    lines.push(`- ${weekLabel} (${dayCount} days)`);
    (week.days ?? []).slice(0, 7).forEach((day, dayPos) => {
      const exerciseNames = flattenDayExercises(day)
        .slice(0, 12)
        .map((exercise) => exercise.name)
        .join(", ");
      const dayLabel = day.name ?? day.code;
      lines.push(
        `  - Day ${dayPos + 1} (${dayLabel}): ${exerciseNames || "no exercises"}`,
      );
    });
    if ((week.days?.length ?? 0) > 7) {
      lines.push("  - … additional days omitted");
    }
  });

  if (plan.weeks.length > 8) {
    lines.push("- … additional weeks omitted");
  }

  return lines.join("\n");
}

function summarizeWeekDetail(
  plan: WorkoutPlan,
  weekPos: number,
  week: WorkoutPlan["weeks"][number],
): string {
  const lines: string[] = [
    `Plan: ${plan.name}`,
    `Week ${weekPos}: ${getWeekTitle(week, weekPos)}`,
  ];

  (week.days ?? []).forEach((day, dayPos) => {
    const exerciseNames = flattenDayExercises(day)
      .map((exercise) => exercise.name)
      .join(", ");
    const dayLabel = day.name ?? day.code;
    lines.push(
      `  - Day ${dayPos} (${dayLabel}): ${exerciseNames || "no exercises"}`,
    );
  });

  return lines.join("\n");
}

function summarizeDayDetail(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
  week: WorkoutPlan["weeks"][number],
  day: NonNullable<WorkoutPlan["weeks"][number]["days"]>[number],
): string {
  const lines: string[] = [
    `Plan: ${plan.name}`,
    `Week ${weekPos}: ${getWeekTitle(week, weekPos)}`,
    `Day ${dayPos}: ${getDayTitle(day, dayPos)} (${day.code})`,
  ];

  if (day.notes?.trim()) {
    lines.push(`Day notes: ${day.notes.trim()}`);
  }

  const blocks = day.blocks ?? [];
  if (blocks.length === 0) {
    lines.push("No blocks.");
    return lines.join("\n");
  }

  blocks.forEach((block, blockPos) => {
    const blockHeader =
      block.label?.trim() ??
      (isSupersetBlock(block) ? `Block ${blockPos} (superset)` : `Block ${blockPos}`);
    lines.push(blockHeader);

    block.exercises.forEach((exercise) => {
      lines.push(`  ${formatExerciseWithSets(exercise)}`);
    });
  });

  return lines.join("\n");
}

function formatExerciseWithSets(exercise: Exercise): string {
  const parts = [`${exercise.name}:`];

  if (exercise.notes?.trim()) {
    parts.push(`notes=${exercise.notes.trim()}`);
  }

  const setSummary = formatExerciseSets(exercise.sets);
  parts.push(setSummary || "no sets");

  return parts.join(" ");
}

function formatExerciseSets(sets: Exercise["sets"]): string {
  if (!sets.length) {
    return "";
  }

  const formatted = sets.map((set) => formatPlannedSetBrief(set));
  const allIdentical = formatted.length > 1 && formatted.every((line) => line === formatted[0]);

  if (allIdentical) {
    return `${sets.length}× ${formatted[0]}`;
  }

  return formatted.join(", ");
}

function formatPlannedSetBrief(set: Set): string {
  const planned = set.planned;
  const parts: string[] = [formatPlannedSetCore(planned)];

  const notes = getPlannedSetNotes(planned);
  if (notes) {
    parts.push(`[${notes}]`);
  }

  if (set.status !== "planned") {
    parts.push(`(${set.status})`);
  }

  return parts.join(" ");
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

function getPlannedSetNotes(planned: PlannedSet): string | undefined {
  const notes = planned.notes?.trim();
  return notes || undefined;
}
