import { createClient } from "@/utils/supabase/server";
import type {
  AthleteCoachLink,
  CoachAthleteRelationship,
  PendingInvite,
} from "@/lib/links/types";

type LinksClient = Awaited<ReturnType<typeof createClient>>;

type AthleteCoachLinkRow = {
  relationship_id: string;
  status: "pending" | "active";
  coach_id: string;
  coach_name: string | null;
  requested_at: string;
  linked_at: string | null;
};

type PendingInviteRow = {
  relationship_id: string;
  athlete_id: string;
  athlete_name: string | null;
  athlete_email: string | null;
  requested_at: string;
};

type CoachAthleteRelationshipRow = {
  relationship_id: string;
  status: "pending" | "active";
  athlete_id: string;
  athlete_name: string | null;
  athlete_email: string | null;
  linked_at: string | null;
};

async function resolveClient(client?: LinksClient): Promise<LinksClient> {
  return client ?? (await createClient());
}

export function mapAthleteCoachLinkRow(row: AthleteCoachLinkRow): AthleteCoachLink {
  return {
    relationshipId: row.relationship_id,
    status: row.status,
    coachId: row.coach_id,
    coachName: row.coach_name?.trim() || "Coach",
    requestedAt: row.requested_at,
    linkedAt: row.linked_at,
  };
}

export function mapPendingInviteRow(row: PendingInviteRow): PendingInvite {
  return {
    relationshipId: row.relationship_id,
    athleteId: row.athlete_id,
    athleteName: row.athlete_name?.trim() || "Unnamed athlete",
    athleteEmail: row.athlete_email?.trim() || "",
    requestedAt: row.requested_at,
  };
}

export function mapCoachAthleteRelationshipRow(
  row: CoachAthleteRelationshipRow,
): CoachAthleteRelationship {
  return {
    relationshipId: row.relationship_id,
    status: row.status,
    athleteId: row.athlete_id,
    athleteName: row.athlete_name?.trim() || "Unnamed athlete",
    athleteEmail: row.athlete_email?.trim() || "",
    linkedAt: row.linked_at,
  };
}

export async function getAthleteCoachLink(
  client?: LinksClient,
): Promise<AthleteCoachLink | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase.rpc("get_athlete_coach_link");

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as AthleteCoachLinkRow[] | null)?.[0];
  return row ? mapAthleteCoachLinkRow(row) : null;
}

export async function listCoachPendingInvites(
  client?: LinksClient,
): Promise<PendingInvite[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase.rpc("get_coach_pending_invites");

  if (error) {
    throw new Error(error.message);
  }

  return ((data as PendingInviteRow[] | null) ?? []).map(mapPendingInviteRow);
}

export async function countCoachPendingInvites(client?: LinksClient): Promise<number> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase.rpc("count_coach_pending_invites");

  if (error) {
    throw new Error(error.message);
  }

  return Number(data ?? 0);
}

export async function getCoachAthleteRelationship(
  athleteId: string,
  client?: LinksClient,
): Promise<CoachAthleteRelationship | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase.rpc("get_coach_athlete_relationship", {
    p_athlete_id: athleteId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as CoachAthleteRelationshipRow[] | null)?.[0];
  return row ? mapCoachAthleteRelationshipRow(row) : null;
}

export async function requestCoachLink(
  inviteCode: string,
  client?: LinksClient,
): Promise<string> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase.rpc("request_coach_link", {
    p_invite_code: inviteCode.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  return String(data);
}

export async function cancelCoachLinkRequest(
  relationshipId: string,
  client?: LinksClient,
): Promise<void> {
  const supabase = await resolveClient(client);
  const { error } = await supabase.rpc("cancel_coach_link_request", {
    p_relationship_id: relationshipId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function acceptCoachLink(
  relationshipId: string,
  client?: LinksClient,
): Promise<void> {
  const supabase = await resolveClient(client);
  const { error } = await supabase.rpc("accept_coach_link", {
    p_relationship_id: relationshipId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function rejectCoachLink(
  relationshipId: string,
  client?: LinksClient,
): Promise<void> {
  const supabase = await resolveClient(client);
  const { error } = await supabase.rpc("reject_coach_link", {
    p_relationship_id: relationshipId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function unlinkCoachAthlete(
  relationshipId: string,
  client?: LinksClient,
): Promise<void> {
  const supabase = await resolveClient(client);
  const { error } = await supabase.rpc("unlink_coach_athlete", {
    p_relationship_id: relationshipId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
