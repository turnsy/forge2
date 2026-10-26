# Exercise selection

Coaches select an existing global or coach-owned exercise from text search, or
explicitly create a coach-owned exercise. Athletes select existing exercises only.

Names are compared using case and whitespace normalization only. Equipment,
variation, punctuation and parenthetical qualifiers remain part of the identity.
There are no embeddings, semantic thresholds, automatic aliases or AI matching.

Plan saves validate existing selections. A selected exercise must be accessible
to the coach. When an imported/generated name has no selection, save uses an exact
name match or creates a private exercise with that name. Repeated names within a
save reuse the same catalog entry. Renamed exercises are resolved again rather
than retaining a previous exercise's identity. Percentage bases use the same rules.

Typing in the max-entry exercise field invalidates the previous selection; save
requires selecting or creating an exercise again. Failed search/create requests
are displayed as errors.

## Rollout

Apply `20261026023414_simplify_exercise_matching.sql` with the PR migrations before
testing the updated app. It rebuilds normalized name keys from stored names and
removes the unused semantic-search RPC. Existing catalog IDs, plan references,
max histories and embedding data are preserved. The application no longer uses
the embedding data. Do not merge or rename existing catalog records automatically.

Training-max updates and relationship permissions are described in
[training-maxes.md](./training-maxes.md).
