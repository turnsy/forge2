import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

let workerConfigured = false;

const WORKER_RELATIVE_PATHS = [
  "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
  "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs",
];

function getProjectRoots(): string[] {
  const cwd = process.cwd();
  const roots = [cwd];

  if (path.basename(cwd) !== "forge-next") {
    const nested = path.join(cwd, "forge-next");
    if (fs.existsSync(path.join(nested, "package.json"))) {
      roots.push(nested);
    }
  }

  return roots;
}

function resolvePdfWorkerPath(): string {
  for (const root of getProjectRoots()) {
    for (const rel of WORKER_RELATIVE_PATHS) {
      const candidate = path.join(root, rel);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  const pnpmRoot = path.join(process.cwd(), "node_modules/.pnpm");
  if (fs.existsSync(pnpmRoot)) {
    const match = fs
      .readdirSync(pnpmRoot)
      .find((entry) => entry.startsWith("pdf-parse@"));
    if (match) {
      const candidate = path.join(
        pnpmRoot,
        match,
        "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
      );
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error(
    "pdf-parse worker file not found. Run pnpm install in forge-next.",
  );
}

/**
 * pdf-parse uses pdf.js workers. Next.js/Turbopack externals break
 * require.resolve()-based paths; resolve the worker on disk under node_modules.
 */
export function ensurePdfParseWorker(): void {
  if (workerConfigured) {
    return;
  }

  const workerPath = resolvePdfWorkerPath();
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  workerConfigured = true;
}
