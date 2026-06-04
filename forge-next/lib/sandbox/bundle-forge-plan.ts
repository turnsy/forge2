import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const FORGE_PLAN_ROOT = join(process.cwd(), "sandbox", "forge_plan");

const SKIP_NAMES = new Set(["__pycache__", "test_forge_plan.py", "README.md"]);

/**
 * Collect forge_plan library files for upload into the sandbox VM.
 */
export function bundleForgePlanFiles(): { path: string; content: Buffer }[] {
  const files: { path: string; content: Buffer }[] = [];

  function walk(dir: string): void {
    for (const name of readdirSync(dir)) {
      if (SKIP_NAMES.has(name)) {
        continue;
      }

      const absolute = join(dir, name);
      const stat = statSync(absolute);
      if (stat.isDirectory()) {
        walk(absolute);
        continue;
      }

      if (!name.endsWith(".py")) {
        continue;
      }

      const rel = relative(FORGE_PLAN_ROOT, absolute).replace(/\\/g, "/");
      files.push({
        path: join("forge_plan", rel),
        content: readFileSync(absolute),
      });
    }
  }

  walk(FORGE_PLAN_ROOT);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
