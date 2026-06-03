import path from "node:path";
import {
  getMaxBytesForExtension,
  isAllowedUploadExtension,
  type UploadAllowedExtension,
} from "@/lib/uploads/limits";

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function getAllowedExtension(
  filename: string,
): UploadAllowedExtension | null {
  const ext = getFileExtension(filename);
  return isAllowedUploadExtension(ext) ? ext : null;
}

export function getMaxBytesForFilename(filename: string): number | null {
  const ext = getAllowedExtension(filename);
  return ext ? getMaxBytesForExtension(ext) : null;
}

export function filenameToSlug(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "upload";
}
