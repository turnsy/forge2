import { z } from "zod";
export const valueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);
export const answersSchema = z
  .array(
    z.object({
      fieldId: z.string().uuid(),
      version: z.number().int().positive(),
      value: valueSchema,
      unit: z.string().optional(),
    }),
  )
  .max(100);
