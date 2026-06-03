/**
 * Supabase Storage layout for ephemeral coach upload context (Phase 2+).
 *
 * Bucket: `draft-uploads` (private). Create in Supabase Dashboard or migration
 * before enabling upload-context API. RLS must scope objects to the owning coach.
 *
 * Object key pattern:
 *   draft-uploads/{coachId}/{draftId}/{slug}.txt
 *
 * Multi-sheet XLSX uses one object per sheet, e.g.:
 *   {workbook-stem}__{sheet-slug}.txt
 *
 * Normalized text is for the LLM prompt only — never copied into Vercel Sandbox.
 *
 * @see docs/plan-generation/phases/phase-2-upload-normalization.md
 * @see docs/plan-generation/supabase-draft-uploads.md
 */

export const DRAFT_UPLOADS_BUCKET = "draft-uploads" as const;

export function draftUploadPrefix(coachId: string, draftId: string): string {
  return `${coachId}/${draftId}`;
}

export function draftUploadObjectPath(
  coachId: string,
  draftId: string,
  slug: string,
): string {
  const safeSlug = slug.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${coachId}/${draftId}/${safeSlug}.txt`;
}
