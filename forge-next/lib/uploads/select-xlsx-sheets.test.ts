import { describe, expect, it } from "vitest";
import { selectXlsxSheet } from "@/lib/uploads/select-xlsx-sheets";

describe("selectXlsxSheet", () => {
  it("uses the only sheet when workbook has one", () => {
    expect(selectXlsxSheet(["Data"])).toEqual({
      ok: true,
      sheetName: "Data",
    });
  });

  it("fuzzy-matches sheet name from prompt text", () => {
    expect(
      selectXlsxSheet(["Summary", "Weekly Volume"], "use the Weekly Volume tab"),
    ).toEqual({
      ok: true,
      sheetName: "Weekly Volume",
    });
  });

  it("requires clarification when multiple sheets and no prompt match", () => {
    expect(selectXlsxSheet(["A", "B"], "hello")).toEqual({
      ok: false,
      needsClarification: true,
      sheets: ["A", "B"],
    });
  });
});
