import { expect, it, vi } from "vitest";
import { createCoachExercise } from "./repository";
import type { createClient } from "@/utils/supabase/data-client";

const exercise = { id: "id", name: "Bench Press (dumbbell)", normalized_name: "bench press (dumbbell)", owner_coach_id: "coach" };
function client(insertError: { code: string } | null = null) {
  const query = {
    insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    single: vi.fn(async () => ({ data: insertError ? null : exercise, error: insertError })),
    maybeSingle: vi.fn(async () => ({ data: exercise, error: null })),
  };
  const from = vi.fn(() => query);
  return { query, from, supabase: { from } as unknown as Awaited<ReturnType<typeof createClient>> };
}

it("creates the named exercise without attempting an embedding write", async () => {
  const mock = client();
  await expect(createCoachExercise(" Bench Press (dumbbell) ", "coach", mock.supabase)).resolves.toEqual(exercise);
  expect(mock.query.insert).toHaveBeenCalledWith({ name: exercise.name, normalized_name: exercise.normalized_name, owner_coach_id: "coach" });
  expect(mock.from.mock.calls).toEqual([["exercises"]]);
});

it("recovers an exact match when concurrent creation hits the unique key", async () => {
  const mock = client({ code: "23505" });
  await expect(createCoachExercise(exercise.name, "coach", mock.supabase)).resolves.toEqual(exercise);
  expect(mock.query.eq).toHaveBeenCalledWith("normalized_name", exercise.normalized_name);
});

it("rejects blank exercise names without writing a catalog row", async () => {
  const mock = client();
  await expect(createCoachExercise("  ", "coach", mock.supabase)).rejects.toThrow("name is required");
  expect(mock.from).not.toHaveBeenCalled();
});
