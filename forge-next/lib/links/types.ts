export type CoachLinkStatus = "pending" | "active";

export type AthleteCoachLink = {
  relationshipId: string;
  status: CoachLinkStatus;
  coachId: string;
  coachName: string;
  requestedAt: string;
  linkedAt: string | null;
};

export type PendingInvite = {
  relationshipId: string;
  athleteId: string;
  athleteName: string;
  athleteEmail: string;
  requestedAt: string;
};

export type CoachAthleteRelationship = {
  relationshipId: string;
  status: CoachLinkStatus;
  athleteId: string;
  athleteName: string;
  athleteEmail: string;
  linkedAt: string | null;
};

export type LinkActionResult =
  | { ok: true }
  | { ok: false; error: string };
