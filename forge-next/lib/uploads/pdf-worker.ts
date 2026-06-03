import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

let workerConfigured = false;

/**
 * pdf-parse uses pdf.js workers. Next.js bundles break the default worker path;
 * point at the package's worker file before parsing.
 */
export function ensurePdfParseWorker(): void {
  if (workerConfigured) {
    return;
  }

  const require = createRequire(import.meta.url);
  const entry = require.resolve("pdf-parse");
  const workerPath = path.join(path.dirname(entry), "pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  workerConfigured = true;
}
