import Ajv from "ajv";
import schema from "@/schemas/athlete-metadata.schema.json";
import type { MetadataFieldDefinition } from "./definition.generated";
export type Definition = MetadataFieldDefinition;
export type Field = Definition & {
  id: string;
  coach_id: string;
  version: number;
};
export type Value = string | number | boolean | string[] | null;
export type Answer = {
  field_id: string;
  value: Value;
  updated_at: string;
  updated_by: string;
};
export type Snapshot = { fields: Field[]; values: Answer[]; missing: Field[] };
const validate = new Ajv().compile<Definition>(schema);
export function validateDefinition(input: unknown): Definition {
  if (!validate(input))
    throw new Error(
      "Invalid field definition: " + new Ajv().errorsText(validate.errors),
    );
  if (
    !input.label.trim() ||
    new Set(input.options.map((o) => o.id)).size !== input.options.length
  )
    throw new Error("Labels must be nonempty and option IDs unique.");
  if (input.options.some((o) => !o.label.trim()))
    throw new Error("Option labels must be nonempty.");
  if (
    input.min !== undefined &&
    input.max !== undefined &&
    input.min > input.max
  )
    throw new Error("Minimum exceeds maximum.");
  if (input.semantic && input.type !== "date")
    throw new Error("Birth date must be a date field.");
  return input;
}
export function isMissing(value: Value | undefined) {
  return (
    value == null || value === "" || (Array.isArray(value) && !value.length)
  );
}
export function validateValue(field: Definition, value: Value): Value {
  if (value === null) return null;
  const fail = () => {
    throw new Error(`Invalid value for ${field.label}.`);
  };
  if (field.type === "text") {
    if (typeof value !== "string" || value.length > (field.maxLength ?? 10000))
      return fail();
    return value.trim() || null;
  }
  if (field.type === "number") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (field.min !== undefined && value < field.min) ||
      (field.max !== undefined && value > field.max)
    )
      return fail();
    if (
      field.precision !== undefined &&
      Math.abs(
        value * 10 ** field.precision -
          Math.round(value * 10 ** field.precision),
      ) > 1e-6
    )
      return fail();
  } else if (field.type === "boolean") {
    if (typeof value !== "boolean") return fail();
  } else if (field.type === "date") {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value ||
      (field.semantic === "birth_date" &&
        value > new Date().toISOString().slice(0, 10))
    )
      return fail();
  } else if (field.type === "single_select") {
    if (
      typeof value !== "string" ||
      !field.options.some((o) => o.id === value && !o.archived)
    )
      return fail();
  } else if (field.type === "multi_select") {
    if (
      !Array.isArray(value) ||
      new Set(value).size !== value.length ||
      value.some((id) => !field.options.some((o) => o.id === id && !o.archived))
    )
      return fail();
    if (!value.length) return null;
  }
  return value;
}
const conversions: Record<string, { dimension: string; scale: number }> = {
  kg: { dimension: "mass", scale: 1 },
  lb: { dimension: "mass", scale: 0.45359237 },
  cm: { dimension: "length", scale: 1 },
  in: { dimension: "length", scale: 2.54 },
  m: { dimension: "length", scale: 100 },
};
export function convertUnit(value: number, from: string, to: string) {
  if (from === to) return value;
  const a = conversions[from],
    b = conversions[to];
  if (!a || !b || a.dimension !== b.dimension)
    throw new Error(`Cannot convert ${from} to ${to}.`);
  return (value * a.scale) / b.scale;
}
export function formatValue(field: Definition, value: Value) {
  if (value === null) return "Unanswered";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field.type === "multi_select" || field.type === "single_select")
    return (Array.isArray(value) ? value : [String(value)])
      .map((id) => field.options.find((o) => o.id === id)?.label ?? id)
      .join(", ");
  return `${value}${field.type === "number" && field.unit ? ` ${field.unit}` : ""}`;
}
