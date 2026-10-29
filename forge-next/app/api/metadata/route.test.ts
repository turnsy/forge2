import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/session", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/links/repository", () => ({ getAthleteCoachLink: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/metadata/repository", () => ({
  getMetadata: vi.fn(),
  listFields: vi.fn(),
  saveField: vi.fn(),
  setMetadata: vi.fn(),
  metadataHistory: vi.fn(),
  listMetadataAthletes: vi.fn(),
}));
import { GET, POST } from "./route";
import { getAuthUser } from "@/lib/auth/session";
import { getAthleteCoachLink } from "@/lib/links/repository";
import {
  getMetadata,
  saveField,
  setMetadata,
  listMetadataAthletes,
} from "@/lib/metadata/repository";
const athleteId = "10000000-0000-4000-8000-000000000001";
const otherId = "10000000-0000-4000-8000-000000000002";
const coachId = "20000000-0000-4000-8000-000000000001";
const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => vi.resetAllMocks());
it("requires authentication", async () => {
  vi.mocked(getAuthUser).mockResolvedValue(null);
  expect((await GET(new Request("http://localhost/api/metadata"))).status).toBe(
    401,
  );
  expect(getMetadata).not.toHaveBeenCalled();
});
it("derives coach ownership from the session", async () => {
  vi.mocked(getAuthUser).mockResolvedValue({
    id: coachId,
    role: "coach",
    fullName: null,
    email: undefined,
  });
  const definition = {
    label: "Custom",
    type: "text",
    required: true,
    options: [],
    position: 0,
    archived: false,
  };
  vi.mocked(saveField).mockResolvedValue({
    field: { ...definition, id: "field", coach_id: coachId, version: 1 },
    missingAthleteCount: 4,
  } as Awaited<ReturnType<typeof saveField>>);
  const response = await post({ op: "field", definition, coachId: "forged" });
  expect(response.status).toBe(200);
  expect(saveField).toHaveBeenCalledWith(
    coachId,
    definition,
    undefined,
    undefined,
  );
  expect(await response.json()).toMatchObject({ missingAthleteCount: 4 });
});
it("allows athletes to edit their own pending answers but forbids other athlete IDs and definitions", async () => {
  vi.mocked(getAuthUser).mockResolvedValue({
    id: athleteId,
    role: "athlete",
    fullName: null,
    email: undefined,
  });
  vi.mocked(getAthleteCoachLink).mockResolvedValue({
    coachId,
    status: "pending",
  } as Awaited<ReturnType<typeof getAthleteCoachLink>>);
  vi.mocked(setMetadata).mockResolvedValue({
    fields: [],
    values: [],
    missing: [],
  });
  expect((await post({ op: "values", athleteId, answers: [] })).status).toBe(
    200,
  );
  expect(setMetadata).toHaveBeenCalledWith(coachId, athleteId, []);
  expect(
    (await post({ op: "values", athleteId: otherId, answers: [] })).status,
  ).toBe(403);
  expect((await post({ op: "field", definition: {} })).status).toBe(403);
  expect((await post({ op: "search", filters: [] })).status).toBe(403);
  expect(
    (
      await GET(
        new Request(`http://localhost/api/metadata?athleteId=${otherId}`),
      )
    ).status,
  ).toBe(403);
});
it("validates malformed filters before running the roster query", async () => {
  vi.mocked(getAuthUser).mockResolvedValue({
    id: coachId,
    role: "coach",
    fullName: null,
    email: undefined,
  });
  expect(
    (
      await post({
        op: "search",
        filters: [{ fieldId: otherId, op: "arbitrary_sql" }],
      })
    ).status,
  ).toBe(400);
  expect(listMetadataAthletes).not.toHaveBeenCalled();
});
it("returns validation errors rather than claiming a successful save", async () => {
  vi.mocked(getAuthUser).mockResolvedValue({
    id: coachId,
    role: "coach",
    fullName: null,
    email: undefined,
  });
  vi.mocked(setMetadata).mockRejectedValue(
    new Error("Field changed. Refresh and try again."),
  );
  const response = await post({ op: "values", athleteId, answers: [] });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: expect.stringContaining("Field changed"),
  });
});
