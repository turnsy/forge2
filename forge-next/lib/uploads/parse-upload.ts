import * as XLSX from "xlsx";
import { getPDFParse } from "@/lib/uploads/pdf-runtime";
import { getAllowedExtension } from "@/lib/uploads/file-utils";
import type { ParseUploadResult, UploadWarning } from "@/lib/uploads/types";

/** Max CSV rows included in normalized context (footer notes truncation). */
export const UPLOAD_CSV_MAX_ROWS = 500;

export type ParseUploadInput = {
  filename: string;
  buffer: Buffer;
  mimeType?: string;
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
  const PDFParse = await getPDFParse();
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
  return workbook.SheetNames.filter((name) => name.trim().length > 0);
}

export function parseXlsxAllSheets(
  filename: string,
  buffer: Buffer,
): ParseUploadResult[] {
  const sheetNames = listXlsxSheetNames(buffer);
  if (sheetNames.length === 0) {
    return [
      {
        ok: false,
        code: "PARSE_FAILED",
        message: `No sheets found in ${filename}.`,
      },
    ];
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const results: ParseUploadResult[] = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      results.push({
        ok: false,
        code: "PARSE_FAILED",
        message: `Sheet "${sheetName}" was not found in ${filename}.`,
      });
      continue;
    }

    const content = XLSX.utils.sheet_to_csv(sheet, { FS: ",", RS: "\n" });
    results.push({
      ok: true,
      upload: {
        kind: "xlsx",
        filename,
        sheetName,
        content,
        allSheetNames: sheetNames,
      },
    });
  }

  return results;
}

/**
 * Parse one uploaded file. Returns one result for CSV/PDF, one per sheet for XLSX.
 */
export async function parseUploadFile(
  input: ParseUploadInput,
): Promise<ParseUploadResult[]> {
  const extension = getAllowedExtension(input.filename);
  if (!extension) {
    return [
      {
        ok: false,
        code: "UNSUPPORTED_TYPE",
        message: `Unsupported file type: ${input.filename}`,
      },
    ];
  }

  switch (extension) {
    case ".csv":
      return [parseCsvUpload(input.filename, input.buffer)];
    case ".pdf":
      return [await parsePdfUpload(input.filename, input.buffer)];
    case ".xlsx":
    case ".xls":
      return parseXlsxAllSheets(input.filename, input.buffer);
    default:
      return [
        {
          ok: false,
          code: "UNSUPPORTED_TYPE",
          message: `Unsupported file type: ${input.filename}`,
        },
      ];
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
