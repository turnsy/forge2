import { z } from "zod";
import { normalizeListQuery } from "@/lib/lists/query";

export const listInputSchema = z.object({
  q: z.string().optional().describe("Optional search query."),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .describe("Page number (default 1)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Page size (default 10)."),
});

export function toListQuery(input: z.infer<typeof listInputSchema>) {
  const parsed = listInputSchema.parse(input);

  return normalizeListQuery({
    q: parsed.q,
    page: String(parsed.page),
    limit: String(parsed.limit),
  });
}
