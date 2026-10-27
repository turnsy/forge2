# Exercise selection

Global exercises are autocomplete templates. Selecting one creates or reuses a
coach-owned exercise. Search prefers the coach's entry and hides the matching
global template, including after the owned entry is renamed. Athletes select
existing entries from their active coach's library and cannot create exercises.

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

The coach's Exercises page lists only their active exercises, with inline rename
and a delete dialog showing usage in current templates and unfinished assignments.
Used exercises require another owned exercise as a replacement (autocomplete may
claim a global template for that purpose). Deletion archives the original; it
does not transfer max history to a different exercise.

Renames/replacements append template versions and update only unlogged sets in
active assignments. Partly logged exercises split into historical and future
rows so recorded actuals and source set IDs remain unchanged. Completed
assignments and old template versions remain intact. New template/assignment
writes reject archived, global, and foreign catalog references.
Athlete draft saves also bind to the displayed exercise, catalog, and set IDs;
a stale screen cannot apply a weight to a different set after a replacement.

Apply `20261027023553_coach_exercise_library.sql` after the earlier PR migrations.
It adopts previously used globals into coach libraries, preserving recorded max
values, ordering, and source provenance. Embeddings remain unused.

Training-max updates and relationship permissions are described in
[training-maxes.md](./training-maxes.md).
