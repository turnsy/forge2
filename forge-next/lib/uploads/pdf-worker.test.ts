import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensurePdfParseWorkerForTests } from "@/lib/uploads/pdf-runtime";

describe("ensurePdfParseWorker", () => {
  it("resolves the worker file under node_modules on disk", async () => {
    await ensurePdfParseWorkerForTests();

    const workerPath = path.join(
      process.cwd(),
      "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
    );

    expect(fs.existsSync(workerPath)).toBe(true);
  });
});
