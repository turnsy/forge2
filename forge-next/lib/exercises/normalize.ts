/**
 * Catalog identity normalization. Preserve equipment and variation qualifiers.
 */
export function normalizeExercise(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
