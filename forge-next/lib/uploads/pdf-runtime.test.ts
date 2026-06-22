import { describe, expect, it, vi } from "vitest";
import { ensurePdfDomPolyfills } from "@/lib/uploads/pdf-runtime";

describe("ensurePdfDomPolyfills", () => {
  it("allows pdf-parse to load when @napi-rs/canvas is unavailable", async () => {
    vi.resetModules();

    const originalDomMatrix = globalThis.DOMMatrix;
    const originalImageData = globalThis.ImageData;
    const originalPath2D = globalThis.Path2D;

    try {
      // Simulate the Vercel serverless environment where canvas APIs are missing
      // until we polyfill them.
      // @ts-expect-error — test override
      delete globalThis.DOMMatrix;
      // @ts-expect-error — test override
      delete globalThis.ImageData;
      // @ts-expect-error — test override
      delete globalThis.Path2D;

      ensurePdfDomPolyfills();

      const { getPDFParse } = await import("@/lib/uploads/pdf-runtime");
      const PDFParse = await getPDFParse();
      expect(typeof PDFParse).toBe("function");
    } finally {
      globalThis.DOMMatrix = originalDomMatrix;
      globalThis.ImageData = originalImageData;
      globalThis.Path2D = originalPath2D;
    }
  });
});
