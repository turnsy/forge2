import { expect, it, vi } from "vitest";
vi.mock("./mutations", () => ({ insertAthleteMax: vi.fn() }));
import { parseMaxInput } from "./api";
const input = {
  exerciseId: "30000000-0000-0000-0000-000000000001",
  value: 100,
  unit: "kg",
};
it("validates max writes from the JSON schema", () => {
  expect(parseMaxInput(input)).toEqual(input);
  expect(parseMaxInput({ ...input, unit: " LB " })?.unit).toBe("lb");
  for (const value of [0, -1, NaN, Infinity])
    expect(parseMaxInput({ ...input, value })).toBeNull();
  for (const value of [
    null,
    [],
    {},
    { ...input, exerciseId: "bad" },
    { ...input, unit: "stone" },
    { ...input, source: "logged_single" },
  ]) {
    expect(parseMaxInput(value)).toBeNull();
  }
});
