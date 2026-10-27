import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function assertEveBuildEnvironment(environment) {
  if (!environment.VERCEL?.trim()) return;

  const missing = ["VERCEL_DEPLOYMENT_ID", "VERCEL_PROJECT_ID"].filter(
    (name) => !environment[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Cannot provision Eve sandbox templates: missing ${missing.join(", ")}. ` +
        "Enable Vercel system environment variables and build on Vercel from source. " +
        "Do not deploy a locally built bundle with vercel deploy --prebuilt: " +
        "its sandbox template scope may differ from the production runtime.",
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertEveBuildEnvironment(process.env);
  const result = spawnSync("pnpm", ["exec", "eve", "build"], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
