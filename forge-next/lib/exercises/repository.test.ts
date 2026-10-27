import { expect, it, vi } from "vitest";
import { createCoachExercise } from "./repository";
import type { createClient } from "@/utils/supabase/data-client";
const exercise = { id: "id", name: "Bench Press (dumbbell)", normalized_name: "bench press (dumbbell)", owner_coach_id: "coach" };
it("claims an exercise through the authorized idempotent RPC", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: exercise, error: null });
  const client = { rpc } as unknown as Awaited<ReturnType<typeof createClient>>;
  await expect(createCoachExercise(" Bench Press (dumbbell) ", "coach", client)).resolves.toEqual(exercise);
  expect(rpc).toHaveBeenCalledWith("claim_coach_exercise", { p_name: exercise.name });
});
it("rejects blank names without writing and propagates database failures", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("Database unavailable") });
  const client = { rpc } as unknown as Awaited<ReturnType<typeof createClient>>;
  await expect(createCoachExercise("  ", "coach", client)).rejects.toThrow("name is required");
  expect(rpc).not.toHaveBeenCalled();
  await expect(createCoachExercise("Squat", "coach", client)).rejects.toThrow("Database unavailable");
});
