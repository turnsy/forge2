import { beforeEach, expect, it, vi } from "vitest";
const { query, rpc } = vi.hoisted(() => ({
  query: { select: vi.fn(), eq: vi.fn(), is: vi.fn(), or: vi.fn(), maybeSingle: vi.fn() },
  rpc: vi.fn(),
}));
vi.mock("@/utils/supabase/data-client", () => ({
  createClient: async () => ({ from: () => query, rpc }),
}));
import { confirmExerciseSelection } from "./confirm-selection";
beforeEach(() => {
  vi.clearAllMocks();
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.or.mockReturnValue(query);
});
it("turns a selected global template into a coach-owned exercise", async () => {
  query.maybeSingle.mockResolvedValue({
    data: { id: "global", name: "Bench", owner_coach_id: null },
    error: null,
  });
  rpc.mockResolvedValue({
    data: { id: "owned", name: "Bench", owner_coach_id: "coach" },
    error: null,
  });
  expect(await confirmExerciseSelection({ exerciseId: "global" }, "coach")).toMatchObject({
    id: "owned",
  });
  expect(rpc).toHaveBeenCalledWith("claim_coach_exercise", { p_exercise_id: "global" });
});
it("keeps existing owned selections and never lets athletes claim a global", async () => {
  query.maybeSingle.mockResolvedValue({
    data: { id: "owned", name: "Bench", owner_coach_id: "coach" },
    error: null,
  });
  expect(await confirmExerciseSelection({ exerciseId: "owned" }, "coach", false)).toMatchObject({
    id: "owned",
  });
  expect(rpc).not.toHaveBeenCalled();
  query.maybeSingle.mockResolvedValue({
    data: { id: "global", name: "Bench", owner_coach_id: null },
    error: null,
  });
  await expect(confirmExerciseSelection({ exerciseId: "global" }, "coach", false)).rejects.toThrow(
    "coach's library",
  );
  expect(rpc).not.toHaveBeenCalled();
});
