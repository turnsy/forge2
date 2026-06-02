import { describe, expect, it } from "vitest";
import {
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_CSV_MAX_BYTES,
  UPLOAD_MAX_FILES_PER_MESSAGE,
  UPLOAD_MAX_TOTAL_BYTES,
  UPLOAD_PDF_MAX_BYTES,
  UPLOAD_XLSX_MAX_BYTES,
  getMaxBytesForExtension,
  isAllowedUploadExtension,
} from "@/lib/uploads/limits";

describe("upload limits", () => {
  it("exports policy caps from overview", () => {
    expect(UPLOAD_MAX_FILES_PER_MESSAGE).toBe(5);
    expect(UPLOAD_MAX_TOTAL_BYTES).toBe(25 * 1024 * 1024);
    expect(UPLOAD_CSV_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(UPLOAD_XLSX_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(UPLOAD_PDF_MAX_BYTES).toBe(10 * 1024 * 1024);
  });

  it("maps extensions to per-type caps", () => {
    expect(getMaxBytesForExtension(".csv")).toBe(UPLOAD_CSV_MAX_BYTES);
    expect(getMaxBytesForExtension(".pdf")).toBe(UPLOAD_PDF_MAX_BYTES);
  });

  it("rejects unsupported extensions", () => {
    expect(isAllowedUploadExtension(".txt")).toBe(false);
    expect(UPLOAD_ALLOWED_EXTENSIONS).toContain(".xlsx");
  });
});
