# Training maxes

"Max" is the current training reference used for percentage prescriptions.
The newest valid entry wins, even when a manual update lowers the value. This
feature does not maintain a separate personal-record or estimated-max concept.

## Updates and history

- Athletes and actively linked coaches append manual updates in kg or lb.
- Updating a max never overwrites or deletes an earlier recorded value.
- Only clicking **Complete workout** can promote a recorded single rep with a
  positive absolute weight. It uses the weight actually lifted, without estimation.
- Autosaves, corrections, and clearing draft fields never change a max. Completed
  sets are final for athlete logging; there is no automatic correction/invalidation
  flow after completion. Manual max updates remain available.
- Multi-rep/combined-rep sets, percentage values and lighter singles do not raise it.
- Comparisons convert kg/lb before deciding whether the new single is heavier.
- Automatic updates reference their source assignment and set. Retrying completion
  does not duplicate history, including the final workout in an assignment.
- Old `estimated_from_log` entries are retained as invalidated history and no longer
  drive percentage weights. Entries with invalid units are not used as current maxes.

Draft saves update only the addressed set. Workout completion reads the latest
stored actuals and commits set statuses, assignment completion, and max updates in
one transaction. Per-athlete locks serialize manual and automatic max writes;
entry order breaks equal-timestamp ties. The earlier preview's autosave promotions
are retained as retired history, so they cannot leak into the new behavior.

## Permissions

Pending and revoked coach relationships cannot read or append athlete maxes.
Manual input cannot claim to be an automatic log entry. Direct authenticated
INSERT/UPDATE/DELETE operations on max history are disallowed; writes use the
authorized RPCs. New exercise references belong to the authorized coach. Athletes
may also update exercises already in their own recorded max history. Recorded exercise
names remain visible with authorized max history, including after unlinking.

Only coaches create catalog exercises. Athletes can still update their own
existing maxes after unlinking; unrecorded private catalog entries remain hidden.

## Deployment and verification

Apply the PR's pending migrations in order before preview QA:

1. `20260715142000_max_delete_and_exercise_rls.sql`
2. `20261026023414_simplify_exercise_matching.sql`
3. `20261026025633_append_only_training_maxes.sql`
4. `20261026174809_block_plan_completion.sql`
5. `20261026175130_restrict_training_max_rpc_access.sql`
6. `20261027023553_coach_exercise_library.sql`
7. `20261027030112_complete_workout_training_maxes.sql`
8. `20261027032505_guard_workout_set_identity.sql`

The history migration retires the intermediate delete RPC. Historical migrations
are retained so existing databases can advance without rewriting migration history.

Run isolated database assertions with a running local Supabase Postgres container:

```sh
node scripts/test-training-maxes.mjs supabase_db_forge
```

The test runner creates and removes its own disposable database; it does not
modify the container's existing application database. Database-type generation
uses pinned Supabase CLI/formatter versions for reproducible CI diffs.
