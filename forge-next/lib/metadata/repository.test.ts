import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/utils/supabase/data-client", () => ({ createClient: vi.fn() }));
import { createClient } from "@/utils/supabase/data-client";
import { setMetadata, getMetadata } from "./repository";
import type { Definition } from "./domain";
const id = "30000000-0000-4000-8000-000000000001";
const definition: Definition = {
  label: "Weight",
  type: "number",
  unit: "kg",
  required: true,
  position: 0,
  archived: false,
  options: [],
};
let tables: Record<string, unknown[]>;
const rpc = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  tables = {
    athlete_metadata_fields: [
      { id, coach_id: "coach", version: 2, definition },
    ],
    athlete_metadata_values: [],
    coach_athletes: [{ id: "link" }],
  };
  const from = (table: string) => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      is: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => ({
        data: tables[table]?.[0] ?? null,
        error: null,
      }),
      then: (resolve: (value: unknown) => void) =>
        Promise.resolve({ data: tables[table] ?? [], error: null }).then(
          resolve,
        ),
    };
    return builder;
  };
  vi.mocked(createClient).mockResolvedValue({ from, rpc } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
});
it("normalizes units before atomic save and returns refreshed completion", async () => {
  rpc.mockResolvedValue({ error: null });
  const result = await setMetadata("coach", "athlete", [
    { fieldId: id, version: 2, value: 100, unit: "lb" },
  ]);
  expect(rpc).toHaveBeenCalledWith("set_athlete_metadata", {
    p_coach_id: "coach",
    p_athlete_id: "athlete",
    p_answers: [{ fieldId: id, version: 2, value: 45.359237 }],
  });
  expect(result.missing).toHaveLength(1);
});
it("rejects stale, invalid, and duplicate answers before writing", async () => {
  await expect(
    setMetadata("coach", "athlete", [{ fieldId: id, version: 1, value: 60 }]),
  ).rejects.toThrow("Field changed");
  await expect(
    setMetadata("coach", "athlete", [{ fieldId: id, version: 2, value: "60" }]),
  ).rejects.toThrow("Invalid value");
  await expect(
    setMetadata("coach", "athlete", [
      { fieldId: id, version: 2, value: 60 },
      { fieldId: id, version: 2, value: 70 },
    ]),
  ).rejects.toThrow("duplicate");
  expect(rpc).not.toHaveBeenCalled();
});
it("never claims success on database access or version failures", async () => {
  rpc.mockResolvedValue({
    error: { message: "Field changed. Refresh and try again." },
  });
  await expect(
    setMetadata("coach", "athlete", [{ fieldId: id, version: 2, value: 60 }]),
  ).rejects.toThrow("Field changed");
  tables.coach_athletes = [];
  await expect(getMetadata("coach", "athlete")).rejects.toThrow(
    "access denied",
  );
});
it("reports invalid stored answers as incomplete, preserving zero as answered", async () => {
  tables.athlete_metadata_values = [{ field_id: id, value: 0 }];
  expect((await getMetadata("coach", "athlete")).missing).toHaveLength(0);
  tables.athlete_metadata_values = [{ field_id: id, value: "bad" }];
  expect((await getMetadata("coach", "athlete")).missing).toHaveLength(1);
});
