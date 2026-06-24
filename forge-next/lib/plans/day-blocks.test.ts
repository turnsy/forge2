import { describe, expect, it } from "vitest";
import { getSupersetRounds, isSupersetBlock } from "@/lib/plans/day-blocks";
import { makeBlock, makeExercise, makeSet } from "@/lib/plans/__tests__/fixtures";

describe("getSupersetRounds", () => {
  it("returns empty array for single-exercise blocks", () => {
    const block = makeBlock({
      exercises: [makeExercise({ name: "Squat" })],
    });

    expect(isSupersetBlock(block)).toBe(false);
    expect(getSupersetRounds(block)).toEqual([]);
  });

  it("groups sets by round across exercises", () => {
    const block = makeBlock({
      exercises: [
        makeExercise({
          id: "curl",
          name: "Curl",
          sets: [
            makeSet({ id: "curl-1", planned: { type: "exact", reps: 12, target: { type: "absolute", value: 20, unit: "kg" } } }),
            makeSet({ id: "curl-2", planned: { type: "exact", reps: 10, target: { type: "absolute", value: 22, unit: "kg" } } }),
          ],
        }),
        makeExercise({
          id: "extension",
          name: "Tricep extension",
          sets: [
            makeSet({ id: "ext-1", planned: { type: "exact", reps: 12, target: { type: "absolute", value: 15, unit: "kg" } } }),
            makeSet({ id: "ext-2", planned: { type: "exact", reps: 10, target: { type: "absolute", value: 17, unit: "kg" } } }),
          ],
        }),
      ],
    });

    const rounds = getSupersetRounds(block);

    expect(rounds).toHaveLength(2);
    expect(rounds[0]?.roundNumber).toBe(1);
    expect(rounds[0]?.entries.map((entry) => entry.exercise.name)).toEqual([
      "Curl",
      "Tricep extension",
    ]);
    expect(rounds[0]?.entries.map((entry) => entry.set.id)).toEqual(["curl-1", "ext-1"]);
    expect(rounds[1]?.roundNumber).toBe(2);
    expect(rounds[1]?.entries.map((entry) => entry.set.id)).toEqual(["curl-2", "ext-2"]);
  });

  it("skips missing sets when exercises have uneven set counts", () => {
    const block = makeBlock({
      exercises: [
        makeExercise({
          id: "curl",
          name: "Curl",
          sets: [
            makeSet({ id: "curl-1" }),
            makeSet({ id: "curl-2" }),
            makeSet({ id: "curl-3" }),
          ],
        }),
        makeExercise({
          id: "extension",
          name: "Tricep extension",
          sets: [makeSet({ id: "ext-1" })],
        }),
      ],
    });

    const rounds = getSupersetRounds(block);

    expect(rounds).toHaveLength(3);
    expect(rounds[0]?.entries).toHaveLength(2);
    expect(rounds[1]?.entries).toHaveLength(1);
    expect(rounds[1]?.entries[0]?.exercise.name).toBe("Curl");
    expect(rounds[2]?.entries).toHaveLength(1);
    expect(rounds[2]?.entries[0]?.set.id).toBe("curl-3");
  });
});
