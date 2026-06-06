import {
  UPLOAD_MAX_FILES_PER_MESSAGE,
  UPLOAD_MAX_TOTAL_BYTES,
} from "@/lib/uploads/limits";
import {
  getAllowedExtension,
  getMaxBytesForFilename,
} from "@/lib/uploads/file-utils";

export type ClientFileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateClientFiles(files: File[]): ClientFileValidationResult {
  if (files.length > UPLOAD_MAX_FILES_PER_MESSAGE) {
    return {
      ok: false,
      message: `A maximum of ${UPLOAD_MAX_FILES_PER_MESSAGE} files is allowed per message.`,
    };
  }

  let totalBytes = 0;
  for (const file of files) {
    totalBytes += file.size;
    const extension = getAllowedExtension(file.name);
    if (!extension) {
      return {
        ok: false,
        message: `Unsupported file type: ${file.name}`,
      };
    }

    const maxBytes = getMaxBytesForFilename(file.name);
    if (maxBytes !== null && file.size > maxBytes) {
      return {
        ok: false,
        message: `${file.name} exceeds the size limit for ${extension} files.`,
      };
    }
  }

  if (totalBytes > UPLOAD_MAX_TOTAL_BYTES) {
    return {
      ok: false,
      message: "Total upload size exceeds the limit.",
    };
  }

  return { ok: true };
}
