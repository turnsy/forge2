import type { z } from "zod";

export const FORM_PARSE_ERROR =
  "Please check your entries and try again.";

export type ParseFormDataResult<T> =
  | { success: true; data: T }
  | { success: false };

export function formDataToRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {};
  formData.forEach((value, key) => {
    record[key] = String(value);
  });
  return record;
}

export function parseFormData<TSchema extends z.ZodType>(
  schema: TSchema,
  formData: FormData,
): ParseFormDataResult<z.infer<TSchema>> {
  const result = schema.safeParse(formDataToRecord(formData));
  if (!result.success) {
    return { success: false };
  }

  return { success: true, data: result.data };
}

export function toFormData(
  values: Record<string, string | number | boolean | null | undefined>,
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return formData;
}
