import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolContext } from "eve/tools";
import assignPlan from "../tools/assign_plan";
import acceptLink from "../tools/accept_coach_link";
import rejectLink from "../tools/reject_coach_link";
import { assignPlanToAthletes } from "@/lib/plans/mutations";
import { acceptCoachLink, rejectCoachLink } from "@/lib/links/repository";

vi.mock("./with-forge-db", () => ({ withForgeDbContextAsync: (_ctx: unknown, fn: () => unknown) => fn() }));
vi.mock("@/lib/plans/mutations", () => ({ assignPlanToAthletes: vi.fn() }));
vi.mock("@/lib/links/repository", () => ({ acceptCoachLink: vi.fn(), rejectCoachLink: vi.fn() }));

const ctx = { session: { auth: { current: { principalId: "coach-1" } } } } as unknown as ToolContext;
const anonymous = { session: { auth: {} } } as unknown as ToolContext;

describe("actions after conversational confirmation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("assigns all selected athletes in one ordinary tool call without a second approval", async () => {
    vi.mocked(assignPlanToAthletes).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof assignPlanToAthletes>>);
    expect(assignPlan.approval).toBeUndefined();
    const input = { planId: "00000000-0000-4000-8000-000000000001", athleteIds: ["00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000003"] };
    const result = await assignPlan.execute(input, ctx);
    expect(result).toMatchObject({ ok: true, ...input });
    expect(assignPlanToAthletes).toHaveBeenCalledExactlyOnceWith(input.planId, input.athleteIds);
  });

  it("uses the same ordinary tool mechanism for link decisions", async () => {
    expect(acceptLink.approval).toBeUndefined();
    expect(rejectLink.approval).toBeUndefined();
    await expect(acceptLink.execute({ relationshipId: "request-1" }, ctx)).resolves.toEqual({ ok: true, relationshipId: "request-1" });
    await expect(rejectLink.execute({ relationshipId: "request-2" }, ctx)).resolves.toEqual({ ok: true, relationshipId: "request-2" });
    expect(acceptCoachLink).toHaveBeenCalledExactlyOnceWith("request-1");
    expect(rejectCoachLink).toHaveBeenCalledExactlyOnceWith("request-2");
  });

  it("still rejects unauthenticated mutation execution", async () => {
    await expect(assignPlan.execute({ planId: "plan", athleteIds: ["athlete"] }, anonymous)).rejects.toThrow("Coach authentication required");
    await expect(acceptLink.execute({ relationshipId: "request" }, anonymous)).rejects.toThrow("Coach authentication required");
    await expect(rejectLink.execute({ relationshipId: "request" }, anonymous)).rejects.toThrow("Coach authentication required");
    expect(assignPlanToAthletes).not.toHaveBeenCalled();
    expect(acceptCoachLink).not.toHaveBeenCalled();
    expect(rejectCoachLink).not.toHaveBeenCalled();
  });
});
