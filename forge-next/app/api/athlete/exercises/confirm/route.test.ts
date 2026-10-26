import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/api", () => ({ requireApiRole: vi.fn() }));
vi.mock("@/lib/links/repository", () => ({ getAthleteCoachLink: vi.fn() }));
vi.mock("@/lib/exercises/confirm-selection", () => ({ confirmExerciseSelection: vi.fn() }));
import { requireApiRole } from "@/lib/auth/api";
import { getAthleteCoachLink } from "@/lib/links/repository";
import { confirmExerciseSelection } from "@/lib/exercises/confirm-selection";
import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireApiRole).mockResolvedValue({ ok: true, user: { id: "athlete", role: "athlete" } } as Awaited<ReturnType<typeof requireApiRole>>);
  vi.mocked(getAthleteCoachLink).mockResolvedValue({ status: "active", coachId: "coach" } as Awaited<ReturnType<typeof getAthleteCoachLink>>);
});
const request = (body: unknown) => new Request("https://forge.test/api/athlete/exercises/confirm", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

it("rejects athlete-created exercises before invoking catalog creation", async () => {
  expect((await POST(request({ name: "New lift" }))).status).toBe(403);
  expect(confirmExerciseSelection).not.toHaveBeenCalled();
});

it("confirms existing exercise IDs using the active coach catalog", async () => {
  vi.mocked(confirmExerciseSelection).mockResolvedValue({ id: "exercise", name: "Back Squat", normalized_name: "back squat", owner_coach_id: null });
  expect((await POST(request({ exerciseId: "exercise", name: "Ignored name" }))).status).toBe(200);
  expect(confirmExerciseSelection).toHaveBeenCalledWith({ exerciseId: "exercise" }, "coach");
});

it("rejects selection while a coach link is pending", async () => {
  vi.mocked(getAthleteCoachLink).mockResolvedValue({ status: "pending", coachId: "coach" } as Awaited<ReturnType<typeof getAthleteCoachLink>>);
  expect((await POST(request({ exerciseId: "exercise" }))).status).toBe(403);
  expect(confirmExerciseSelection).not.toHaveBeenCalled();
});
