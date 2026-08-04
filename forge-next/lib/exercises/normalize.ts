/**
 * Versioned catalog key normalization. Keep all catalog lookups on this path.
 */
export function normalize_v1(value: string): string {
  return value
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}%\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const normalizeExercise = normalize_v1;
