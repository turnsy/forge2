import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["components/**/*.test.tsx", "jsdom"],
      ["lib/chat/**/*.test.tsx", "jsdom"],
      ["lib/plans/**/*.test.tsx", "jsdom"],
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
