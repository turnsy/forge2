// Isolated database tests. Requires a running local Supabase Postgres container.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
const container = process.argv[2];
if (!container)
  throw new Error(
    "Usage: node scripts/test-training-maxes.mjs <local-postgres-container>",
  );
const database = `forge2_maxes_test_${randomUUID().replaceAll("-", "")}`;
const run = (args, input) =>
  execFileSync(
    "docker",
    ["exec", ...(input ? ["-i"] : []), container, ...args],
    { input, encoding: "utf8" },
  );
run(["createdb", "-U", "postgres", database]);
try {
  const fixture = `create schema auth;
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    create type assignment_status as enum ('active','completed','unassigned');
    create table auth.users(id uuid primary key, email text);
    create table profiles(id uuid primary key, role text not null, deleted_at timestamptz, full_name text);
    create table coach_athletes(coach_id uuid, athlete_id uuid, status text, unlinked_at timestamptz, linked_at timestamptz default now());
    create table assigned_plans(id uuid primary key, athlete_id uuid, coach_id uuid, status assignment_status, plan_data jsonb, plan_id uuid, completed_at timestamptz);
    create table plans(id uuid primary key default gen_random_uuid(), coach_id uuid, active_version_id uuid, updated_at timestamptz default now());
    create table plan_versions(id uuid primary key default gen_random_uuid(), plan_id uuid, plan_data jsonb, change_summary text, created_by uuid, created_at timestamptz default now());
    grant select on plans, plan_versions, assigned_plans to authenticated;
    grant select on profiles, coach_athletes to authenticated;`;
  const migrations = readdirSync("supabase/migrations")
    .filter((name) =>
      /exercise_resolution_and_maxes|seed_global_exercises|max_delete_and_exercise_rls|simplify_exercise_matching|append_only_training_maxes|block_plan_completion|restrict_training_max_rpc_access|coach_exercise_library|complete_workout_training_maxes|guard_workout_set_identity/.test(
        name,
      ),
    )
    .sort()
    .map((name) => {
      const sql = readFileSync(`supabase/migrations/${name}`, "utf8");
      return name.includes("coach_exercise_library") ? readFileSync("supabase/tests/exercise-ownership-before.sql", "utf8") + sql + readFileSync("supabase/tests/exercise-ownership-after.sql", "utf8") : sql;
    })
    .join("\n");
  const tests = readFileSync("supabase/tests/training-maxes.sql", "utf8") + readFileSync("supabase/tests/exercise-library.sql", "utf8");
  process.stdout.write(
    run(
      ["psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1"],
      fixture + migrations + tests,
    ),
  );
} finally {
  run(["dropdb", "-U", "postgres", database]);
  console.log("Removed disposable training-max test database.");
}
