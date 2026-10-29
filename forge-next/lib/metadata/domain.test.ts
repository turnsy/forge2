import { describe, expect, it } from "vitest";
import {
  validateDefinition,
  validateValue,
  convertUnit,
  isMissing,
  formatValue,
  type Definition,
} from "./domain";
const base: Definition = {
  label: "Example",
  type: "text",
  required: true,
  position: 0,
  archived: false,
  options: [],
};
describe("arbitrary field definitions", () => {
  it.each([
    "text",
    "number",
    "single_select",
    "multi_select",
    "boolean",
    "date",
  ] as const)("accepts %s", (type) =>
    expect(validateDefinition({ ...base, type }).type).toBe(type),
  );
  it("rejects invalid configuration and duplicate option IDs", () => {
    expect(() => validateDefinition({ ...base, label: " " })).toThrow();
    expect(() =>
      validateDefinition({ ...base, type: "number", min: 10, max: 1 }),
    ).toThrow();
    expect(() =>
      validateDefinition({ ...base, semantic: "birth_date" }),
    ).toThrow();
    expect(() =>
      validateDefinition({
        ...base,
        options: [
          { id: "a", label: "A" },
          { id: "a", label: "B" },
        ],
      }),
    ).toThrow();
    expect(() => validateDefinition({ ...base, precision: 12 })).toThrow();
    expect(() => validateDefinition({ ...base, unexpected: true })).toThrow();
  });
});
describe("answers", () => {
  it("distinguishes false and zero from unanswered", () => {
    expect(isMissing(false)).toBe(false);
    expect(isMissing(0)).toBe(false);
    expect(isMissing([])).toBe(true);
    expect(validateValue({ ...base, type: "boolean" }, false)).toBe(false);
    expect(validateValue({ ...base, type: "number" }, 0)).toBe(0);
  });
  it("clears empty text and multiselect, validates lengths", () => {
    expect(validateValue(base, "  ")).toBeNull();
    expect(validateValue({ ...base, type: "multi_select" }, [])).toBeNull();
    expect(() => validateValue({ ...base, maxLength: 2 }, "long")).toThrow();
  });
  it("validates numbers, ranges, and precision", () => {
    const field = {
      ...base,
      type: "number" as const,
      min: 0,
      max: 100,
      precision: 1,
    };
    expect(validateValue(field, 99.1)).toBe(99.1);
    for (const v of [-1, 101, 3.14, NaN, Infinity, "3"]) {
      expect(() => validateValue(field, v)).toThrow();
    }
  });
  it("uses stable select IDs and rejects retired, duplicate, and invented options", () => {
    const field = {
      ...base,
      type: "multi_select" as const,
      options: [
        { id: "football", label: "Football" },
        { id: "old", label: "Old", archived: true },
      ],
    };
    expect(validateValue(field, ["football"])).toEqual(["football"]);
    for (const v of [
      ["old"],
      ["football", "football"],
      ["invented"],
      "Football",
    ]) {
      expect(() => validateValue(field, v)).toThrow();
    }
    expect(formatValue(field, ["football"])).toBe("Football");
  });
  it("checks real calendar dates and future birth dates", () => {
    const field = {
      ...base,
      type: "date" as const,
      semantic: "birth_date" as const,
    };
    expect(validateValue(field, "2012-02-29")).toBe("2012-02-29");
    for (const v of ["2011-02-29", "2020-13-01", "2099-01-01", "12/01/2012"]) {
      expect(() => validateValue(field, v)).toThrow();
    }
  });
  it("converts compatible units without guessing arbitrary units", () => {
    expect(convertUnit(100, "lb", "kg")).toBeCloseTo(45.359237);
    expect(convertUnit(72, "in", "cm")).toBeCloseTo(182.88);
    expect(convertUnit(8, "points", "points")).toBe(8);
    expect(() => convertUnit(1, "kg", "cm")).toThrow();
    expect(() => convertUnit(1, "points", "kg")).toThrow();
  });
});
