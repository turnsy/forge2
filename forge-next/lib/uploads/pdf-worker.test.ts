import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensurePdfParseWorker } from "@/lib/uploads/pdf-worker";

describe("ensurePdfParseWorker", () => {
  it("resolves the worker file under node_modules on disk", () => {
    ensurePdfParseWorker();

    const workerPath = path.join(
      process.cwd(),
      "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
    );

    expect(fs.existsSync(workerPath)).toBe(true);
  });
});
