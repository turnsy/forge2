export type CoachPlanListItem = {
  id: string;
  title: string;
  weekCount: number;
  createdAt: string;
};

export type PlanActionResult =
  | { ok: true }
  | { ok: false; error: string };
