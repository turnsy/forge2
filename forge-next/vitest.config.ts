import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  },
  test: {
    projects: [{
      extends: true,
      test: {
        name: "unit",
        environment: "node",
        exclude: ["**/node_modules/**", "**/.eve/**"],
        environmentMatchGlobs: [["components/**/*.test.tsx", "jsdom"], ["app/**/*.test.tsx", "jsdom"], ["lib/chat/**/*.test.tsx", "jsdom"], ["lib/plans/**/*.test.tsx", "jsdom"], ["lib/lists/**/*.test.tsx", "jsdom"]],
        setupFiles: ["./vitest.setup.ts"]
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});