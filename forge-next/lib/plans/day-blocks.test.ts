import { describe, expect, it } from "vitest";
import { getSupersetRounds, isSupersetBlock } from "@/lib/plans/day-blocks";
import { makeBlock, makeExercise, makeSet, makeSupersetBlock } from "@/lib/plans/__tests__/fixtures";

describe("getSupersetRounds", () => {
  it("returns empty array for single-exercise blocks", () => {
    const block = makeBlock({
      exercises: [makeExercise({ name: "Squat" })],
    });

    expect(isSupersetBlock(block)).toBe(false);
    expect(getSupersetRounds(block)).toEqual([]);
  });

  it("groups sets by round across exercises", () => {
    const rounds = getSupersetRounds(makeSupersetBlock());

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
          name: "A",
          sets: [
            makeSet({ id: "a-1" }),
            makeSet({ id: "a-2" }),
            makeSet({ id: "a-3" }),
          ],
        }),
        makeExercise({
          name: "B",
          sets: [makeSet({ id: "b-1" })],
        }),
      ],
    });

    const rounds = getSupersetRounds(block);

    expect(rounds).toHaveLength(3);
    expect(rounds[0]?.entries).toHaveLength(2);
    expect(rounds[1]?.entries).toHaveLength(1);
    expect(rounds[2]?.entries).toHaveLength(1);
  });
});
