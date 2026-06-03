import { describe, expect, it } from "vitest";
import {
  UPLOAD_CSV_MAX_ROWS,
  parseCsvUpload,
  parseUpload,
} from "@/lib/uploads/parse-upload";
import {
  makeCsvBuffer,
  makeXlsxBuffer,
} from "@/lib/uploads/__tests__/fixtures";

describe("parseCsvUpload", () => {
  it("keeps CSV content as text", () => {
    const result = parseCsvUpload("plan.csv", makeCsvBuffer("a,b\n1,2"));
    expect(result).toMatchObject({
      ok: true,
      upload: { kind: "csv", content: "a,b\n1,2" },
    });
  });

  it("truncates large CSV files with a footer note", () => {
    const rows = Array.from(
      { length: UPLOAD_CSV_MAX_ROWS + 10 },
      (_, i) => `row${i},value`,
    );
    const result = parseCsvUpload("big.csv", makeCsvBuffer(rows.join("\n")));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.upload.truncated).toBe(true);
      expect(result.upload.content).toContain("[Truncated:");
      expect(result.warnings?.[0]?.code).toBe("CSV_TRUNCATED");
    }
  });
});

describe("parseUpload xlsx", () => {
  it("parses a single-sheet workbook", async () => {
    const buffer = makeXlsxBuffer({
      Data: [
        ["exercise", "reps"],
        ["Squat", "5"],
      ],
    });
    const result = await parseUpload({
      filename: "workbook.xlsx",
      buffer,
    });
    expect(result).toMatchObject({
      ok: true,
      upload: {
        kind: "xlsx",
        sheetName: "Data",
        content: expect.stringContaining("Squat"),
      },
    });
  });

  it("returns clarification metadata for multi-sheet workbooks", async () => {
    const buffer = makeXlsxBuffer({
      Summary: [["x"]],
      Volume: [["y"]],
    });
    const result = await parseUpload({
      filename: "multi.xlsx",
      buffer,
      promptText: "unrelated",
    });
    expect(result).toEqual({
      needsClarification: true,
      sheets: ["Summary", "Volume"],
      filename: "multi.xlsx",
    });
  });
});

describe("parseUpload validation", () => {
  it("rejects unsupported extensions", async () => {
    const result = await parseUpload({
      filename: "notes.txt",
      buffer: Buffer.from("hello"),
    });
    expect(result).toEqual({
      ok: false,
      code: "UNSUPPORTED_TYPE",
      message: expect.stringContaining("notes.txt"),
    });
  });
});
