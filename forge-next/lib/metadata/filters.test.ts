import { expect, it } from "vitest";
import { validateFilters } from "./filters";
import type { Field } from "./domain";
const field: Field = {
  id: "30000000-0000-4000-8000-000000000001",
  coach_id: "coach",
  version: 1,
  label: "Weight",
  type: "number",
  unit: "kg",
  required: false,
  options: [],
  position: 0,
  archived: false,
};
it("normalizes filter units and supports missing answers", () => {
  expect(
    validateFilters(
      [field],
      [
        {
          fieldId: field.id,
          op: "between",
          value: 100,
          upper: 200,
          unit: "lb",
        },
      ],
    )[0],
  ).toMatchObject({ value: 45.359237, upper: 90.718474 });
  expect(
    validateFilters([field], [{ fieldId: field.id, op: "missing" }]),
  ).toHaveLength(1);
});
it("rejects unknown fields, invalid ranges, incompatible operators, and types", () => {
  for (const filter of [
    { fieldId: field.id, op: "between" as const, value: 20, upper: 10 },
    { fieldId: field.id, op: "contains" as const, value: "10" },
    { fieldId: field.id, op: "gte" as const, value: "10" },
  ])
    expect(() => validateFilters([field], [filter])).toThrow();
  expect(() =>
    validateFilters(
      [{ ...field, archived: true }],
      [{ fieldId: field.id, op: "missing" }],
    ),
  ).toThrow();
});
it("allows age ranges only for birth-date fields", () => {
  const date = {
    ...field,
    type: "date" as const,
    semantic: "birth_date" as const,
  };
  expect(
    validateFilters(
      [date],
      [{ fieldId: field.id, op: "age_between", value: 12, upper: 15 }],
    ),
  ).toHaveLength(1);
  expect(() =>
    validateFilters(
      [{ ...field, type: "date" }],
      [{ fieldId: field.id, op: "age_between", value: 12, upper: 15 }],
    ),
  ).toThrow();
  expect(() =>
    validateFilters(
      [date],
      [{ fieldId: field.id, op: "age_between", value: 12.5, upper: 15 }],
    ),
  ).toThrow();
});

it("accepts false boolean filters without treating them as strings", () => {
  expect(
    validateFilters(
      [{ ...field, type: "boolean" }],
      [{ fieldId: field.id, op: "eq", value: false }],
    )[0].value,
  ).toBe(false);
});
