import { describe, expect, it } from "vitest";
import {
  createExerciseBlock,
  getDayBlocks,
  getSetKey,
  migrateDayToBlocks,
  migratePlanToBlocks,
} from "@/lib/plans/day-blocks";
import { createDefaultDay, createDefaultSuperset } from "@/lib/plans/plan-defaults";

describe("day-blocks", () => {
  it("migrates legacy exercises to exercise blocks", () => {
    const migrated = migrateDayToBlocks({
      index: 1,
      code: "w1d1",
      exercises: [
        {
          name: "Bench Press",
          sets: [
            {
              id: "s1",
              planned: {
                type: "exact",
                reps: 5,
                load: { type: "absolute", value: 100, unit: "kg" },
              },
              actual: null,
              status: "planned",
              locked: false,
            },
          ],
        },
      ],
    });

    expect(migrated.blocks).toHaveLength(1);
    expect(migrated.blocks[0]).toEqual(
      expect.objectContaining({ type: "exercise", exercise: expect.objectContaining({ name: "Bench Press" }) }),
    );
    expect("exercises" in migrated).toBe(false);
  });

  it("upgrades 2.0.0 plans to 2.1.0 blocks", () => {
    const migrated = migratePlanToBlocks({
      schemaVersion: "2.0.0",
      name: "Legacy",
      weeks: [
        {
          index: 1,
          days: [createDefaultDay()],
        },
      ],
    });

    expect(migrated.schemaVersion).toBe("2.1.0");
    expect(getDayBlocks(migrated.weeks[0].days[0])).toHaveLength(1);
  });

  it("builds stable set keys for supersets", () => {
    const superset = createDefaultSuperset();
    const day = {
      index: 1,
      code: "w1d1",
      blocks: [createExerciseBlock({ name: "A", sets: superset.exercises[0].sets }), superset],
    };

    expect(getSetKey(1, 0, 2)).toBe("1-0-2");
    expect(getDayBlocks(day)).toHaveLength(2);
  });
});
