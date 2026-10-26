# Training maxes

"Max" is the current training reference used for percentage prescriptions.
The newest valid entry wins, even when a manual update lowers the value. This
feature does not maintain a separate personal-record or estimated-max concept.

## Updates and history

- Athletes and actively linked coaches append manual updates in kg or lb.
- Updating a max never overwrites or deletes an earlier recorded value.
- Only a recorded single rep with a positive absolute weight can automatically
  raise the current max. It uses the weight actually lifted, without estimation.
- Multi-rep/combined-rep sets, percentage values and lighter singles do not raise it.
- Comparisons convert kg/lb before deciding whether the new single is heavier.
- Automatic updates reference their source assignment and set. Repeating the same
  save does not duplicate history. Editing notes alone does not reapply a weight.
- Correcting/clearing a source single invalidates its derived entry but retains
  the recorded value in history. A correction cannot override a newer manual max.
- Old `estimated_from_log` entries are retained as invalidated history and no longer
  drive percentage weights. Entries with invalid units are not used as current maxes.

Workout set writes and related max changes happen in one database transaction.
The transaction updates only the addressed set, so independent saves cannot
overwrite each other's whole-plan snapshots. Per-athlete locks serialize manual
and automatic max writes; entry order breaks equal-timestamp ties.

## Permissions

Pending and revoked coach relationships cannot read or append athlete maxes.
Manual input cannot claim to be an automatic log entry. Direct authenticated
INSERT/UPDATE/DELETE operations on max history are disallowed; writes use the
authorized RPCs. Exercise references must be global, owned by the authorized
coach, or already part of that athlete's recorded max history. Recorded exercise
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

The history migration retires the intermediate delete RPC. Historical migrations
are retained so existing databases can advance without rewriting migration history.

Run isolated database assertions with a running local Supabase Postgres container:

```sh
node scripts/test-training-maxes.mjs supabase_db_forge
```

The test runner creates and removes its own disposable database; it does not
modify the container's existing application database. Database-type generation
uses pinned Supabase CLI/formatter versions for reproducible CI diffs.
