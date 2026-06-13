export type CoachAthleteListItem = {
  id: string;
  name: string;
  email: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
  completionPercent: number | null;
  joinedAt: string;
};

export type CoachAthleteRow = {
  athlete_id: string;
  full_name: string | null;
  email: string | null;
  linked_at: string;
  current_plan_id: string | null;
  current_plan_name: string | null;
  current_assignment_status: string | null;
  completion_percent: number | null;
};
