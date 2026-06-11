import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAccept = vi.fn();
const mockReject = vi.fn();
const mockAssign = vi.fn();

vi.mock("@/lib/links/repository", () => ({
  acceptCoachLink: (...args: unknown[]) => mockAccept(...args),
  rejectCoachLink: (...args: unknown[]) => mockReject(...args),
}));

vi.mock("@/lib/plans/mutations", () => ({
  assignPlanToAthletes: (...args: unknown[]) => mockAssign(...args),
}));

import { createMutateTools } from "@/lib/ai/coach-agent/tools/mutate-tools";

const toolCtx = { messages: [], toolCallId: "1" };

describe("createMutateTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accept_coach_link succeeds", async () => {
    mockAccept.mockResolvedValue(undefined);
    const tools = createMutateTools();
    const result = await tools.accept_coach_link.execute!(
      { relationshipId: "00000000-0000-4000-8000-000000000001" },
      toolCtx,
    );

    expect(result).toEqual({
      ok: true,
      relationshipId: "00000000-0000-4000-8000-000000000001",
    });
  });

  it("reject_coach_link succeeds", async () => {
    mockReject.mockResolvedValue(undefined);
    const tools = createMutateTools();
    const result = await tools.reject_coach_link.execute!(
      { relationshipId: "00000000-0000-4000-8000-000000000002" },
      toolCtx,
    );

    expect(result).toEqual({
      ok: true,
      relationshipId: "00000000-0000-4000-8000-000000000002",
    });
  });

  it("assign_plan succeeds", async () => {
    mockAssign.mockResolvedValue({ ok: true });
    const tools = createMutateTools();
    const result = await tools.assign_plan.execute!(
      {
        planId: "00000000-0000-4000-8000-000000000010",
        athleteIds: ["00000000-0000-4000-8000-000000000020"],
      },
      toolCtx,
    );

    expect(result).toEqual({
      ok: true,
      planId: "00000000-0000-4000-8000-000000000010",
      athleteIds: ["00000000-0000-4000-8000-000000000020"],
    });
  });

  it("assign_plan maps RPC errors", async () => {
    mockAssign.mockResolvedValue({
      ok: false,
      code: "validation_error",
      message: "Athlete not linked to coach",
    });
    const tools = createMutateTools();
    const result = await tools.assign_plan.execute!(
      {
        planId: "00000000-0000-4000-8000-000000000010",
        athleteIds: ["00000000-0000-4000-8000-000000000020"],
      },
      toolCtx,
    );

    expect(result).toEqual({
      ok: false,
      code: "validation_error",
      message: "Athlete not linked to coach",
    });
  });
});
