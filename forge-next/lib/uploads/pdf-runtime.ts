import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type PDFParseClass = typeof import("pdf-parse").PDFParse;

let pdfParseModule: { PDFParse: PDFParseClass } | null = null;
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

function resolvePdfWorkerPath(): string | null {
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

  return null;
}

/**
 * pdf-parse pulls in pdf.js, which expects browser canvas APIs. On Vercel the
 * optional native `@napi-rs/canvas` package often fails to load; without
 * polyfills the module throws during import and breaks upload-context for all
 * file types.
 */
export function ensurePdfDomPolyfills(): void {
  if (!globalThis.DOMMatrix) {
    globalThis.DOMMatrix = class DOMMatrix {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;

      constructor(_init?: string | number[]) {}

      static fromMatrix() {
        return new DOMMatrix();
      }
    } as typeof DOMMatrix;
  }

  if (!globalThis.ImageData) {
    globalThis.ImageData = class ImageData {
      width: number;
      height: number;
      data: Uint8ClampedArray;

      constructor(width = 1, height = 1) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    } as typeof ImageData;
  }

  if (!globalThis.Path2D) {
    globalThis.Path2D = class Path2D {} as typeof Path2D;
  }
}

function ensurePdfParseWorker(PDFParse: PDFParseClass): void {
  if (workerConfigured) {
    return;
  }

  const workerPath = resolvePdfWorkerPath();
  if (workerPath) {
    PDFParse.setWorker(pathToFileURL(workerPath).href);
  } else {
    PDFParse.setWorker(
      "https://cdn.jsdelivr.net/npm/pdf-parse@2.4.5/dist/pdf-parse/esm/pdf.worker.mjs",
    );
  }

  workerConfigured = true;
}

export async function getPDFParse(): Promise<PDFParseClass> {
  ensurePdfDomPolyfills();

  if (!pdfParseModule) {
    pdfParseModule = await import("pdf-parse");
  }

  ensurePdfParseWorker(pdfParseModule.PDFParse);
  return pdfParseModule.PDFParse;
}

/** @deprecated Use getPDFParse() — kept for existing tests. */
export async function ensurePdfParseWorkerForTests(): Promise<void> {
  await getPDFParse();
}
