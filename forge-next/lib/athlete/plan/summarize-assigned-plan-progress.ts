import {
  areAllDaysComplete,
  computePlanCompletionPercent,
  findCurrentDay,
} from "@/lib/athlete/plan/domain";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";
import { formatDate } from "@/lib/format/date";
import { flattenDayExercises, isSupersetBlock } from "@/lib/plans/day-blocks";
import {
  formatReps,
  formatTarget,
  formatTargetInstruction,
  getDayTitle,
  getWeekTitle,
} from "@/lib/plans/display";
import type { Day, Set, WorkoutPlan } from "@/lib/plans/workout-plan";

export type SummarizeAssignedPlanProgressOptions = {
  athleteName: string;
  assignment: AssignedPlan;
  /** 0-based week index (same as plan.week(n)). */
  week?: number;
  /** 0-based day index within the week. Requires week. */
  day?: number;
};

/**
 * Compact text summary of an athlete's active assignment. Never includes full plan JSON.
 */
export function summarizeAssignedPlanProgress(
  options: SummarizeAssignedPlanProgressOptions,
): string {
  const { athleteName, assignment, week, day } = options;
  const plan = assignment.plan;

  if (options.day !== undefined && options.week === undefined) {
    return "day requires week (0-based indices, same as plan.week(n).day(m)).";
  }

  if (!plan.weeks?.length) {
    return `Athlete: ${athleteName}\nNo workout content in the active assignment.`;
  }

  if (week !== undefined) {
    const weekData = plan.weeks[week];
    if (!weekData) {
      return `Week index ${week} out of range (plan has ${plan.weeks.length} week(s)).`;
    }

    if (day !== undefined) {
      const dayData = weekData.days?.[day];
      if (!dayData) {
        const dayCount = weekData.days?.length ?? 0;
        return `Day index ${day} out of range (week ${week} has ${dayCount} day(s)).`;
      }

      return summarizeAssignedDayDetail(
        athleteName,
        assignment,
        plan,
        week,
        day,
        weekData,
        dayData,
      );
    }

    return summarizeAssignedWeekDetail(athleteName, plan, week, weekData);
  }

  return summarizeAssignedOverview(athleteName, assignment, plan);
}

export function countSkippedDays(plan: WorkoutPlan): number {
  let count = 0;

  for (const week of plan.weeks) {
    for (const day of week.days ?? []) {
      if (isDaySkipped(day)) {
        count += 1;
      }
    }
  }

  return count;
}

function isDaySkipped(day: Day): boolean {
  const exercises = flattenDayExercises(day);
  if (exercises.length === 0) {
    return false;
  }

  return exercises.every((exercise) =>
    exercise.sets.every((set) => set.status === "skipped"),
  );
}

function isDayCompleted(day: Day): boolean {
  const exercises = flattenDayExercises(day);
  if (exercises.length === 0) {
    return false;
  }

  return exercises.every((exercise) =>
    exercise.sets.every((set) => set.status === "completed"),
  );
}

function getDayProgressStatus(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
  day: Day,
): string {
  if (isDaySkipped(day)) {
    return "skipped";
  }

  if (isDayCompleted(day)) {
    return "completed";
  }

  const current = findCurrentDay(plan);
  if (current?.weekPos === weekPos && current?.dayPos === dayPos) {
    return "in progress";
  }

  const hasProgress = flattenDayExercises(day).some((exercise) =>
    exercise.sets.some((set) => set.status !== "planned"),
  );
  if (hasProgress) {
    return "in progress";
  }

  return "upcoming";
}

function summarizeAssignedOverview(
  athleteName: string,
  assignment: AssignedPlan,
  plan: WorkoutPlan,
): string {
  const lines: string[] = [
    `Athlete: ${athleteName}`,
    `Plan: ${plan.name} (${assignment.status})`,
    `Completion: ${computePlanCompletionPercent(plan)}%`,
  ];

  const current = findCurrentDay(plan);
  if (current) {
    const dayLabel = getDayTitle(current.day, current.dayPos);
    lines.push(
      `Current: Week ${current.weekPos}, Day ${current.dayPos} (${dayLabel})`,
    );
  } else if (areAllDaysComplete(plan)) {
    lines.push("Current: program complete");
  } else {
    lines.push("Current: none");
  }

  lines.push(`Skipped days: ${countSkippedDays(plan)}`);
  lines.push(`Assigned: ${formatDate(assignment.assignedAt)}`);

  return lines.join("\n");
}

function summarizeAssignedWeekDetail(
  athleteName: string,
  plan: WorkoutPlan,
  weekPos: number,
  week: WorkoutPlan["weeks"][number],
): string {
  const lines: string[] = [
    `Athlete: ${athleteName}`,
    `Plan: ${plan.name}`,
    `Week ${weekPos}: ${getWeekTitle(week, weekPos)}`,
  ];

  (week.days ?? []).forEach((day, dayPos) => {
    const exerciseNames = flattenDayExercises(day)
      .map((exercise) => exercise.name)
      .join(", ");
    const dayLabel = day.name ?? day.code;
    const status = getDayProgressStatus(plan, weekPos, dayPos, day);
    lines.push(
      `  - Day ${dayPos} (${dayLabel}): ${status} — ${exerciseNames || "no exercises"}`,
    );
  });

  return lines.join("\n");
}

function summarizeAssignedDayDetail(
  athleteName: string,
  assignment: AssignedPlan,
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
  week: WorkoutPlan["weeks"][number],
  day: NonNullable<WorkoutPlan["weeks"][number]["days"]>[number],
): string {
  const status = getDayProgressStatus(plan, weekPos, dayPos, day);
  const lines: string[] = [
    `Athlete: ${athleteName}`,
    `Plan: ${plan.name} (${assignment.status})`,
    `Week ${weekPos}: ${getWeekTitle(week, weekPos)}`,
    `Day ${dayPos}: ${getDayTitle(day, dayPos)} (${day.code}) — ${status}`,
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
      lines.push(`  ${exercise.name}:`);
      exercise.sets.forEach((set, setIndex) => {
        lines.push(`    ${formatAssignedSetLine(set, setIndex)}`);
      });
    });
  });

  return lines.join("\n");
}

function formatAssignedSetLine(set: Set, setIndex: number): string {
  const planned = formatPlannedSetDescription(set);
  const status = set.status;

  if (!set.actual) {
    return `Set ${setIndex + 1}: ${planned} — ${status}`;
  }

  const logged = formatActualSetDescription(set);
  return `Set ${setIndex + 1}: ${planned} — ${status} (logged: ${logged})`;
}

function formatPlannedSetDescription(set: Set): string {
  const { planned } = set;

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

function formatActualSetDescription(set: Set): string {
  if (!set.actual) {
    return "";
  }

  const parts: string[] = [];

  if (set.actual.reps !== undefined && set.actual.reps !== "") {
    parts.push(formatReps(set.actual.reps));
  }

  if (set.actual.target) {
    parts.push(`@ ${formatTarget(set.actual.target)}`);
  }

  if (parts.length === 0 && set.actual.notes?.trim()) {
    return set.actual.notes.trim();
  }

  return parts.join(" ") || "recorded";
}
