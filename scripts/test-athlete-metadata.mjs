// Isolated PostgreSQL tests: never connects to a hosted Supabase project.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const container = process.argv[2];
if (!container)
  throw new Error(
    "Usage: node scripts/test-athlete-metadata.mjs <local-postgres-container>",
  );
const database = `forge_metadata_${randomUUID().replaceAll("-", "")}`;
const run = (args, input) =>
  execFileSync(
    "docker",
    ["exec", ...(input ? ["-i"] : []), container, ...args],
    { input, encoding: "utf8" },
  );
run(["createdb", "-U", "postgres", database]);
try {
  const sql =
    readFileSync("supabase/tests/metadata-fixture.sql", "utf8") +
    readFileSync(
      "supabase/migrations/20260606170000_coach_link_pending.sql",
      "utf8",
    );
  // The minimal fixture already contains the linking columns. Test actual link RPCs separately below.
  const linking = sql.slice(
    sql.indexOf("create or replace function public.normalize_invite_code"),
  );
  process.stdout.write(
    run(
      ["psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1"],
      readFileSync("supabase/tests/metadata-fixture.sql", "utf8") +
        linking +
        readFileSync(
          "supabase/migrations/20261029140910_athlete_metadata.sql",
          "utf8",
        ) +
        readFileSync("supabase/tests/athlete-metadata.sql", "utf8"),
    ),
  );
} finally {
  run(["dropdb", "-U", "postgres", database]);
  console.log("Removed disposable metadata database.");
}
