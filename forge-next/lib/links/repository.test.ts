import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRpc = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
  })),
}));

import {
  countCoachPendingInvites,
  getAthleteCoachLink,
  listCoachPendingInvites,
  mapAthleteCoachLinkRow,
  mapCoachAthleteRelationshipRow,
  mapPendingInviteRow,
  requestCoachLink,
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

describe("link repository RPCs", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("returns null when athlete has no link", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await expect(getAthleteCoachLink()).resolves.toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("get_athlete_coach_link");
  });

  it("maps athlete coach link rows from rpc", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          relationship_id: "rel-1",
          status: "pending",
          coach_id: "coach-1",
          coach_name: "Jordan Lee",
          requested_at: "2026-06-01T00:00:00.000Z",
          linked_at: null,
        },
      ],
      error: null,
    });

    await expect(getAthleteCoachLink()).resolves.toEqual({
      relationshipId: "rel-1",
      status: "pending",
      coachId: "coach-1",
      coachName: "Jordan Lee",
      requestedAt: "2026-06-01T00:00:00.000Z",
      linkedAt: null,
    });
  });

  it("lists pending invites", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          relationship_id: "rel-3",
          athlete_id: "athlete-1",
          athlete_name: "Alex Rivera",
          athlete_email: "alex@example.com",
          requested_at: "2026-06-01T00:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(listCoachPendingInvites()).resolves.toEqual([
      {
        relationshipId: "rel-3",
        athleteId: "athlete-1",
        athleteName: "Alex Rivera",
        athleteEmail: "alex@example.com",
        requestedAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
  });

  it("counts pending invites", async () => {
    mockRpc.mockResolvedValue({ data: 2, error: null });

    await expect(countCoachPendingInvites()).resolves.toBe(2);
  });

  it("requests a coach link with trimmed invite code", async () => {
    mockRpc.mockResolvedValue({ data: "rel-9", error: null });

    await expect(requestCoachLink("  abc12345  ")).resolves.toBe("rel-9");
    expect(mockRpc).toHaveBeenCalledWith("request_coach_link", {
      p_invite_code: "abc12345",
    });
  });

  it("reuses an injected client instead of creating another one", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: 1, error: null }) };

    await expect(countCoachPendingInvites(client as never)).resolves.toBe(1);

    expect(client.rpc).toHaveBeenCalledWith("count_coach_pending_invites");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("throws repository errors from rpc", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "Invalid invite code" } });

    await expect(requestCoachLink("bad")).rejects.toThrow("Invalid invite code");
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
