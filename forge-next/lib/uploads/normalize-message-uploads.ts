import { draftUploadSlug } from "@/lib/uploads/file-utils";
import {
  normalizedUploadToText,
  parseUploadFile,
} from "@/lib/uploads/parse-upload";
import { validateMessageUploadBatch } from "@/lib/uploads/validate-batch";
import {
  saveUploadContext,
  type ContextFileId,
} from "@/lib/uploads/context-storage";
import type {
  MessageUploadFile,
  UploadContextResult,
  UploadWarning,
} from "@/lib/uploads/types";

export type NormalizeMessageUploadsInput = {
  coachId: string;
  draftId: string;
  files: MessageUploadFile[];
  persist?: boolean;
};

export async function normalizeMessageUploads(
  input: NormalizeMessageUploadsInput,
): Promise<UploadContextResult> {
  const batch = validateMessageUploadBatch(input.files);
  if (!batch.ok) {
    return {
      ok: false,
      error: batch.error,
      message: batch.message,
    };
  }

  const contextFileIds: ContextFileId[] = [];
  const warnings: UploadWarning[] = [];

  for (const file of input.files) {
    const parsedList = await parseUploadFile({
      filename: file.filename,
      buffer: file.buffer,
      mimeType: file.mimeType,
    });

    for (const parsed of parsedList) {
      if (!parsed.ok) {
        return {
          ok: false,
          error: parsed.code,
          message: parsed.message,
        };
      }

      if (parsed.warnings?.length) {
        warnings.push(...parsed.warnings);
      }

      const normalizedText = normalizedUploadToText(parsed.upload);
      const slug =
        parsed.upload.kind === "xlsx"
          ? draftUploadSlug(parsed.upload.filename, parsed.upload.sheetName)
          : draftUploadSlug(parsed.upload.filename);

      if (input.persist !== false) {
        const stored = await saveUploadContext({
          coachId: input.coachId,
          draftId: input.draftId,
          slug,
          normalizedText,
        });

        if (!stored.ok) {
          return {
            ok: false,
            error: "STORAGE_FAILED",
            message: stored.message,
          };
        }

        contextFileIds.push(stored.contextFileId);
      } else {
        contextFileIds.push(
          `${input.coachId}/${input.draftId}/${slug}.txt`,
        );
      }
    }
  }

  return {
    ok: true,
    contextFileIds,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
