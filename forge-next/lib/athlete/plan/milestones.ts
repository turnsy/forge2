import { getDayTitle, getWeekTitle } from "@/lib/plans/display";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import type { CurrentDayLocation } from "@/lib/athlete/plan/domain";

export type AthletePlanMilestone =
  | { kind: "day"; description: string }
  | { kind: "plan"; planName: string; coachName: string };

export function dayCompletedMilestone(currentDay: CurrentDayLocation): AthletePlanMilestone {
  return {
    kind: "day",
    description: `${getWeekTitle(currentDay.week, currentDay.weekPos)} · ${getDayTitle(currentDay.day, currentDay.dayPos)}`,
  };
}

export function planCompletedMilestone(
  plan: WorkoutPlan,
  coachName: string,
): AthletePlanMilestone {
  return {
    kind: "plan",
    planName: plan.name,
    coachName,
  };
}

export function milestoneTitle(milestone: AthletePlanMilestone): string {
  return milestone.kind === "day" ? "Day completed!" : "All workouts complete!";
}

export function milestoneDescription(milestone: AthletePlanMilestone): string {
  return milestone.kind === "day"
    ? milestone.description
    : `${milestone.planName} with ${milestone.coachName}`;
}
