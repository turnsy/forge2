export const COACH_ATHLETE_DETAIL_TABS = [
  "current-plan",
  "previous-plans",
  "maxes",
  "info",
] as const;

export type CoachAthleteDetailTab = (typeof COACH_ATHLETE_DETAIL_TABS)[number];

export function parseCoachAthleteDetailTab(
  value: string | undefined,
): CoachAthleteDetailTab | undefined {
  if (!value) {
    return undefined;
  }

  return COACH_ATHLETE_DETAIL_TABS.includes(value as CoachAthleteDetailTab)
    ? (value as CoachAthleteDetailTab)
    : undefined;
}
