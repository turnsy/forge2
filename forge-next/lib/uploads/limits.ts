/**
 * Upload caps for coach session context files.
 * @see docs/plan-generation/overview.md — Upload policy
 */

export const UPLOAD_MAX_FILES_PER_MESSAGE = 5;

/** Total multipart payload cap (bytes). */
export const UPLOAD_MAX_TOTAL_BYTES = 25 * 1024 * 1024;

export const UPLOAD_CSV_MAX_BYTES = 2 * 1024 * 1024;
export const UPLOAD_XLSX_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_PDF_MAX_BYTES = 10 * 1024 * 1024;

export const UPLOAD_ALLOWED_EXTENSIONS = [
  ".csv",
  ".xlsx",
  ".xls",
  ".pdf",
] as const;

export type UploadAllowedExtension = (typeof UPLOAD_ALLOWED_EXTENSIONS)[number];

const EXTENSION_TO_MAX_BYTES: Record<UploadAllowedExtension, number> = {
  ".csv": UPLOAD_CSV_MAX_BYTES,
  ".xlsx": UPLOAD_XLSX_MAX_BYTES,
  ".xls": UPLOAD_XLSX_MAX_BYTES,
  ".pdf": UPLOAD_PDF_MAX_BYTES,
};

export function getMaxBytesForExtension(
  extension: UploadAllowedExtension,
): number {
  return EXTENSION_TO_MAX_BYTES[extension];
}

export function isAllowedUploadExtension(
  extension: string,
): extension is UploadAllowedExtension {
  return (UPLOAD_ALLOWED_EXTENSIONS as readonly string[]).includes(extension);
}
