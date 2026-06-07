import type { CoachAthleteListItem } from "@/lib/athletes/types";

export function shouldShowAthleteReassignWarning(
  currentPlanName: string | null | undefined,
): boolean {
  return Boolean(currentPlanName?.trim());
}

export function getAthletesWithDifferentActivePlan(
  athletes: CoachAthleteListItem[],
  selectedAthleteIds: ReadonlySet<string>,
  targetPlanId: string,
): CoachAthleteListItem[] {
  return athletes.filter(
    (athlete) =>
      selectedAthleteIds.has(athlete.id) &&
      athlete.currentPlanId !== null &&
      athlete.currentPlanId !== targetPlanId,
  );
}

export function hasAthletesWithDifferentActivePlan(
  athletes: CoachAthleteListItem[],
  selectedAthleteIds: ReadonlySet<string>,
  targetPlanId: string,
): boolean {
  return getAthletesWithDifferentActivePlan(
    athletes,
    selectedAthleteIds,
    targetPlanId,
  ).length > 0;
}
