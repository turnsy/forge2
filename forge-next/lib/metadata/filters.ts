import { z } from "zod";
import { convertUnit, type Field } from "./domain";
export const filterSchema = z.object({
  fieldId: z.string().uuid(),
  op: z.enum([
    "eq",
    "contains",
    "any",
    "all",
    "gte",
    "lte",
    "between",
    "missing",
    "answered",
    "age_between",
  ]),
  value: z
    .union([z.string(), z.number().finite(), z.boolean(), z.array(z.string())])
    .optional(),
  upper: z.union([z.number().finite(), z.string()]).optional(),
  unit: z.string().optional(),
  asOf: z.iso.date().optional(),
});
export type MetadataFilter = z.infer<typeof filterSchema>;
export function validateFilters(fields: Field[], inputs: MetadataFilter[]) {
  return inputs.map((input) => {
    const filter = filterSchema.parse(input);
    const field = fields.find((f) => f.id === filter.fieldId && !f.archived);
    if (!field) throw new Error("Unknown or archived filter field.");
    if (["missing", "answered"].includes(filter.op)) return filter;
    if (filter.value === undefined) throw new Error("Filter requires a value.");
    const allowed: Record<Field["type"], string[]> = {
      text: ["eq", "contains"],
      number: ["eq", "gte", "lte", "between"],
      date: [
        "eq",
        "gte",
        "lte",
        "between",
        ...(field.semantic === "birth_date" ? ["age_between"] : []),
      ],
      single_select: ["eq", "any"],
      multi_select: ["any", "all"],
      boolean: ["eq"],
    };
    if (!allowed[field.type].includes(filter.op))
      throw new Error("Operator does not apply to this field type.");
    if (filter.op === "age_between") {
      if (
        typeof filter.value !== "number" ||
        !Number.isInteger(filter.value) ||
        filter.value < 0 ||
        typeof filter.upper !== "number" ||
        !Number.isInteger(filter.upper) ||
        filter.upper < filter.value
      )
        throw new Error("Invalid age range.");
    } else if (field.type === "number") {
      if (
        typeof filter.value !== "number" ||
        (filter.op === "between" && typeof filter.upper !== "number")
      )
        throw new Error("Numeric filter required.");
      if (filter.unit) {
        if (!field.unit) throw new Error("Field has no unit.");
        filter.value = convertUnit(filter.value, filter.unit, field.unit);
        if (typeof filter.upper === "number")
          filter.upper = convertUnit(filter.upper, filter.unit, field.unit);
      }
    } else if (field.type === "boolean") {
      if (typeof filter.value !== "boolean")
        throw new Error("Boolean filter required.");
    } else if (["any", "all"].includes(filter.op)) {
      if (
        !Array.isArray(filter.value) ||
        !filter.value.length ||
        filter.value.some((id) => !field.options.some((o) => o.id === id))
      )
        throw new Error("Select valid option IDs.");
    } else if (typeof filter.value !== "string")
      throw new Error("String filter required.");
    if (
      field.type === "single_select" &&
      filter.op === "eq" &&
      !field.options.some((o) => o.id === filter.value)
    )
      throw new Error("Select a valid option ID.");
    if (field.type === "date" && filter.op !== "age_between") {
      z.iso.date().parse(filter.value);
      if (filter.upper !== undefined) z.iso.date().parse(filter.upper);
    }
    if (
      filter.op === "between" &&
      (filter.upper === undefined || filter.value > filter.upper)
    )
      throw new Error("Invalid range.");
    return filter;
  });
}
