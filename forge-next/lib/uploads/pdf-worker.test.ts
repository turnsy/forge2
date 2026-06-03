import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensurePdfParseWorker } from "@/lib/uploads/pdf-worker";

describe("ensurePdfParseWorker", () => {
  it("resolves a worker file next to the pdf-parse package entry", () => {
    ensurePdfParseWorker();

    const require = createRequire(import.meta.url);
    const entry = require.resolve("pdf-parse");
    const workerPath = path.join(path.dirname(entry), "pdf.worker.mjs");

    expect(fs.existsSync(workerPath)).toBe(true);
  });
});
