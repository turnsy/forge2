import { describe, expect, it } from "vitest";
import {
  UPLOAD_CSV_MAX_ROWS,
  parseCsvUpload,
  parseUploadFile,
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

describe("parseUploadFile xlsx", () => {
  it("returns one normalized upload per sheet", async () => {
    const buffer = makeXlsxBuffer({
      Summary: [["x"]],
      Volume: [["y"]],
    });
    const results = await parseUploadFile({
      filename: "workbook.xlsx",
      buffer,
    });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.ok)).toBe(true);
    if (results[0]?.ok && results[1]?.ok) {
      expect(results[0].upload).toMatchObject({
        kind: "xlsx",
        sheetName: "Summary",
      });
      expect(results[1].upload).toMatchObject({
        kind: "xlsx",
        sheetName: "Volume",
      });
    }
  });

  it("returns a single result for one-sheet workbooks", async () => {
    const buffer = makeXlsxBuffer({
      Data: [["Squat", "5"]],
    });
    const results = await parseUploadFile({
      filename: "workbook.xlsx",
      buffer,
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: true,
      upload: { kind: "xlsx", sheetName: "Data" },
    });
  });
});

describe("parseUploadFile validation", () => {
  it("rejects unsupported extensions", async () => {
    const results = await parseUploadFile({
      filename: "notes.txt",
      buffer: Buffer.from("hello"),
    });
    expect(results[0]).toEqual({
      ok: false,
      code: "UNSUPPORTED_TYPE",
      message: expect.stringContaining("notes.txt"),
    });
  });
});
