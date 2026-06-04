import {
  UPLOAD_MAX_FILES_PER_MESSAGE,
  UPLOAD_MAX_TOTAL_BYTES,
} from "@/lib/uploads/limits";
import { getAllowedExtension, getMaxBytesForFilename } from "@/lib/uploads/file-utils";
import type { MessageUploadFile, UploadErrorCode } from "@/lib/uploads/types";

export type BatchValidationResult =
  | { ok: true }
  | { ok: false; error: UploadErrorCode; message: string };

export function validateMessageUploadBatch(
  files: MessageUploadFile[],
): BatchValidationResult {
  if (files.length > UPLOAD_MAX_FILES_PER_MESSAGE) {
    return {
      ok: false,
      error: "TOO_MANY_FILES",
      message: `A maximum of ${UPLOAD_MAX_FILES_PER_MESSAGE} files is allowed per message.`,
    };
  }

  const totalBytes = files.reduce((sum, file) => sum + file.buffer.byteLength, 0);
  if (totalBytes > UPLOAD_MAX_TOTAL_BYTES) {
    return {
      ok: false,
      error: "FILE_TOO_LARGE",
      message: `Total upload size exceeds ${UPLOAD_MAX_TOTAL_BYTES} bytes.`,
    };
  }

  for (const file of files) {
    const extension = getAllowedExtension(file.filename);
    if (!extension) {
      return {
        ok: false,
        error: "UNSUPPORTED_TYPE",
        message: `Unsupported file type: ${file.filename}`,
      };
    }

    const maxBytes = getMaxBytesForFilename(file.filename);
    if (maxBytes !== null && file.buffer.byteLength > maxBytes) {
      return {
        ok: false,
        error: "FILE_TOO_LARGE",
        message: `${file.filename} exceeds the ${maxBytes} byte limit for ${extension} files.`,
      };
    }
  }

  return { ok: true };
}
