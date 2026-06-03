import {
  normalizedUploadToText,
  parseUpload,
  type ParseUploadXlsxMeta,
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
  promptText?: string;
  /** Per-file sheet override after user clarification (filename → sheet). */
  xlsxSheetByFilename?: Record<string, string>;
  persist?: boolean;
};

function isXlsxClarification(
  value: unknown,
): value is ParseUploadXlsxMeta {
  return (
    typeof value === "object" &&
    value !== null &&
    "needsClarification" in value &&
    (value as ParseUploadXlsxMeta).needsClarification === true
  );
}

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
    const parsed = await parseUpload({
      filename: file.filename,
      buffer: file.buffer,
      mimeType: file.mimeType,
      promptText: input.promptText,
      xlsxSheetName: input.xlsxSheetByFilename?.[file.filename],
    });

    if (isXlsxClarification(parsed)) {
      return {
        ok: false,
        needsSheetClarification: true,
        sheets: parsed.sheets,
        filename: parsed.filename,
      };
    }

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

    if (input.persist !== false) {
      const stored = await saveUploadContext({
        coachId: input.coachId,
        draftId: input.draftId,
        filename: file.filename,
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
        `${input.coachId}/${input.draftId}/${file.filename}`,
      );
    }
  }

  return {
    ok: true,
    contextFileIds,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
