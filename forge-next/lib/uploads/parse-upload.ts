import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import { getAllowedExtension } from "@/lib/uploads/file-utils";
import {
  selectXlsxSheet,
  type XlsxSheetSelection,
} from "@/lib/uploads/select-xlsx-sheets";
import type {
  ParseUploadFailure,
  ParseUploadResult,
  UploadWarning,
} from "@/lib/uploads/types";

/** Max CSV rows included in normalized context (footer notes truncation). */
export const UPLOAD_CSV_MAX_ROWS = 500;

export type ParseUploadInput = {
  filename: string;
  buffer: Buffer;
  mimeType?: string;
  promptText?: string;
  /** When set, skips sheet selection (used after clarification). */
  xlsxSheetName?: string;
};

export type ParseUploadXlsxMeta = {
  needsClarification: true;
  sheets: string[];
  filename: string;
};

export function parseCsvUpload(
  filename: string,
  buffer: Buffer,
): ParseUploadResult {
  const text = buffer.toString("utf8");
  const lines = text.split(/\r?\n/);
  const warnings: UploadWarning[] = [];

  if (lines.length > UPLOAD_CSV_MAX_ROWS) {
    const truncated = lines.slice(0, UPLOAD_CSV_MAX_ROWS).join("\n");
    warnings.push({
      code: "CSV_TRUNCATED",
      message: `CSV truncated to first ${UPLOAD_CSV_MAX_ROWS} rows.`,
    });
    return {
      ok: true,
      upload: {
        kind: "csv",
        filename,
        content: `${truncated}\n\n[Truncated: showing first ${UPLOAD_CSV_MAX_ROWS} rows only.]`,
        truncated: true,
      },
      warnings,
    };
  }

  return {
    ok: true,
    upload: {
      kind: "csv",
      filename,
      content: text,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function parsePdfUpload(
  filename: string,
  buffer: Buffer,
): Promise<ParseUploadResult> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const warnings: UploadWarning[] = [];
    const sections = result.pages
      .map((page) => {
        const body = page.text.trim();
        if (!body) {
          warnings.push({
            code: "PDF_EMPTY_PAGE",
            message: `Page ${page.num} had no extractable text.`,
          });
          return `## Page ${page.num}\n\n(empty)`;
        }
        return `## Page ${page.num}\n\n${body}`;
      })
      .join("\n\n");

    return {
      ok: true,
      upload: {
        kind: "pdf",
        filename,
        content: sections || result.text.trim(),
        pageCount: result.total,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF text extraction failed.";
    return {
      ok: false,
      code: "PARSE_FAILED",
      message,
    };
  } finally {
    await parser.destroy();
  }
}

export function listXlsxSheetNames(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames;
}

export function parseXlsxSheet(
  filename: string,
  buffer: Buffer,
  sheetName: string,
  allSheetNames: string[],
): ParseUploadResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      ok: false,
      code: "PARSE_FAILED",
      message: `Sheet "${sheetName}" was not found in ${filename}.`,
    };
  }

  const content = XLSX.utils.sheet_to_csv(sheet, { FS: ",", RS: "\n" });
  return {
    ok: true,
    upload: {
      kind: "xlsx",
      filename,
      sheetName,
      content,
      allSheetNames,
    },
  };
}

export function resolveXlsxSheetSelection(
  input: ParseUploadInput,
): XlsxSheetSelection | ParseUploadFailure {
  const sheetNames = listXlsxSheetNames(input.buffer);
  if (input.xlsxSheetName) {
    if (!sheetNames.includes(input.xlsxSheetName)) {
      return {
        ok: false,
        code: "PARSE_FAILED",
        message: `Sheet "${input.xlsxSheetName}" was not found in ${input.filename}.`,
      };
    }
    return { ok: true, sheetName: input.xlsxSheetName };
  }

  return selectXlsxSheet(sheetNames, input.promptText);
}

export async function parseUpload(
  input: ParseUploadInput,
): Promise<ParseUploadResult | ParseUploadXlsxMeta> {
  const extension = getAllowedExtension(input.filename);
  if (!extension) {
    return {
      ok: false,
      code: "UNSUPPORTED_TYPE",
      message: `Unsupported file type: ${input.filename}`,
    };
  }

  switch (extension) {
    case ".csv":
      return parseCsvUpload(input.filename, input.buffer);
    case ".pdf":
      return parsePdfUpload(input.filename, input.buffer);
    case ".xlsx":
    case ".xls": {
      const selection = resolveXlsxSheetSelection(input);
      if ("code" in selection) {
        return selection;
      }
      if (!selection.ok) {
        return {
          needsClarification: true,
          sheets: selection.sheets,
          filename: input.filename,
        };
      }
      const sheetNames = listXlsxSheetNames(input.buffer);
      return parseXlsxSheet(
        input.filename,
        input.buffer,
        selection.sheetName,
        sheetNames,
      );
    }
    default:
      return {
        ok: false,
        code: "UNSUPPORTED_TYPE",
        message: `Unsupported file type: ${input.filename}`,
      };
  }
}

export function normalizedUploadToText(upload: {
  kind: string;
  filename: string;
  content: string;
  sheetName?: string;
}): string {
  const header =
    upload.kind === "xlsx" && upload.sheetName
      ? `# ${upload.filename} (sheet: ${upload.sheetName})\n\n`
      : `# ${upload.filename}\n\n`;
  return `${header}${upload.content}`;
}
