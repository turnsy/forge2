import { describe, expect, it } from "vitest";
import {
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_MAX_FILES_PER_MESSAGE,
  UPLOAD_MAX_TOTAL_BYTES,
  getMaxBytesForExtension,
  isAllowedUploadExtension,
} from "@/lib/uploads/limits";
import {
  SESSION_UPLOADS_BUCKET,
  sessionUploadObjectPath,
  sessionUploadPrefix,
} from "@/lib/uploads/storage-paths";

describe("upload foundation integration", () => {
  it("exposes upload limits and allowed file types", () => {
    expect(UPLOAD_MAX_FILES_PER_MESSAGE).toBe(5);
    expect(UPLOAD_MAX_TOTAL_BYTES).toBeGreaterThan(0);
    expect(UPLOAD_ALLOWED_EXTENSIONS).toContain(".csv");
    expect(isAllowedUploadExtension(".xlsx")).toBe(true);
    expect(isAllowedUploadExtension(".exe")).toBe(false);
    expect(getMaxBytesForExtension(".pdf")).toBeGreaterThan(
      getMaxBytesForExtension(".csv"),
    );
  });

  it("builds session upload storage paths", () => {
    expect(SESSION_UPLOADS_BUCKET).toBe("session-uploads");
    expect(sessionUploadPrefix("coach-1", "session-1")).toBe(
      "coach-1/session-1",
    );
    expect(sessionUploadObjectPath("coach-1", "session-1", "file.csv")).toBe(
      "coach-1/session-1/file.csv.txt",
    );
    expect(
      sessionUploadObjectPath("coach-1", "session-1", "workbook__sheet-1"),
    ).toBe("coach-1/session-1/workbook__sheet-1.txt");
  });

  it("sanitizes unsafe characters in upload object slugs", () => {
    expect(sessionUploadObjectPath("c", "s", "bad/path name!.xlsx")).toBe(
      "c/s/bad_path_name_.xlsx.txt",
    );
  });
});
