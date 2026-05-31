export type CoachPlanSummary = {
  id: string;
  title: string;
};

export type CoachPlanListItem = {
  id: string;
  title: string;
  weekCount: number;
  daysPerWeek: number | string;
  createdAt: string;
};
