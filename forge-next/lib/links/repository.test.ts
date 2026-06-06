import { describe, expect, it } from "vitest";
import {
  mapAthleteCoachLinkRow,
  mapCoachAthleteRelationshipRow,
  mapPendingInviteRow,
} from "@/lib/links/repository";

describe("mapAthleteCoachLinkRow", () => {
  it("maps a pending athlete link", () => {
    expect(
      mapAthleteCoachLinkRow({
        relationship_id: "rel-1",
        status: "pending",
        coach_id: "coach-1",
        coach_name: "Jordan Lee",
        requested_at: "2026-06-01T00:00:00.000Z",
        linked_at: null,
      }),
    ).toEqual({
      relationshipId: "rel-1",
      status: "pending",
      coachId: "coach-1",
      coachName: "Jordan Lee",
      requestedAt: "2026-06-01T00:00:00.000Z",
      linkedAt: null,
    });
  });

  it("falls back when coach name is missing", () => {
    expect(
      mapAthleteCoachLinkRow({
        relationship_id: "rel-2",
        status: "active",
        coach_id: "coach-2",
        coach_name: null,
        requested_at: "2026-06-01T00:00:00.000Z",
        linked_at: "2026-06-02T00:00:00.000Z",
      }),
    ).toEqual({
      relationshipId: "rel-2",
      status: "active",
      coachId: "coach-2",
      coachName: "Coach",
      requestedAt: "2026-06-01T00:00:00.000Z",
      linkedAt: "2026-06-02T00:00:00.000Z",
    });
  });
});

describe("mapPendingInviteRow", () => {
  it("maps a pending invite row", () => {
    expect(
      mapPendingInviteRow({
        relationship_id: "rel-3",
        athlete_id: "athlete-1",
        athlete_name: "Alex Rivera",
        athlete_email: "alex@example.com",
        requested_at: "2026-06-01T00:00:00.000Z",
      }),
    ).toEqual({
      relationshipId: "rel-3",
      athleteId: "athlete-1",
      athleteName: "Alex Rivera",
      athleteEmail: "alex@example.com",
      requestedAt: "2026-06-01T00:00:00.000Z",
    });
  });
});

describe("mapCoachAthleteRelationshipRow", () => {
  it("maps a coach-side relationship row", () => {
    expect(
      mapCoachAthleteRelationshipRow({
        relationship_id: "rel-4",
        status: "active",
        athlete_id: "athlete-2",
        athlete_name: "Sam Chen",
        athlete_email: "sam@example.com",
        linked_at: "2026-06-02T00:00:00.000Z",
      }),
    ).toEqual({
      relationshipId: "rel-4",
      status: "active",
      athleteId: "athlete-2",
      athleteName: "Sam Chen",
      athleteEmail: "sam@example.com",
      linkedAt: "2026-06-02T00:00:00.000Z",
    });
  });
});
