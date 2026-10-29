# Custom athlete profiles

Coaches define arbitrary profile fields in Settings. Both the coach and the athlete can edit answers. Fields and answers are coach scoped; moving to another coach does not share the previous coach's data. There are no starter templates.

Supported types: text, number (optional unit/bounds/precision), single select, multiple select, boolean, and date. A date field can be marked as birth date to enable calculated age filters. Stable field and option IDs preserve answers across renames. Options and fields can be archived.

## Onboarding and completion

An invite-code lookup previews the coach's questions before linking. The athlete can submit partial answers or skip them. Request creation and answer saving share a database transaction. Pending athletes can keep editing their answers; coaches can review/edit them from Pending invites before accepting. Missing answers never block acceptance, existing links, or plans.

Required-field completion is derived from current active definitions and valid current answers. The athletes page shows the affected active-athlete count and an incomplete-profile filter. Field mutations return `missingAthleteCount` for the agent to report.

## Shared implementation

- `schemas/athlete-metadata.schema.json` is the definition contract. `pnpm generate:metadata-types` regenerates its TypeScript interface.
- `lib/metadata/` contains validation, unit conversion, query validation, repositories, and authenticated HTTP identity resolution.
- `components/metadata/` contains the field editor, shared type-driven inputs, athlete editor/history, and roster filters.
- `/api/metadata` serves both coach and athlete editors. Coach ownership comes from authentication; an athlete's coach comes from their pending/active link. RLS checks ownership again.
- `/api/metadata/invite` previews invite questions and submits the atomic intake/link operation.

Pages and agent tools share the repository operations. Current answers live in `athlete_metadata_values`; updates/clears produce immutable events with actor, time, old/new values, and a field-definition snapshot. Compatible kg/lb and cm/in/m field-unit changes convert current answers atomically and append events; historical values retain their original units. Bounds apply in the new unit, so a conversion that violates new bounds fails atomically. Incompatible type/unit/semantic changes after answers exist require a replacement field.

Definition versions reject stale forms. Transaction advisory locks serialize answer saves with definition edits without granting athletes permission to update field definitions. Explicit table grants remove permissive Supabase defaults. The history and unit-conversion definer functions are trigger-only, with direct execution revoked. The invite preview and bounded roster projection have explicit role/scope checks; the latter needs definer access to the existing roster email source in `auth.users`.

## Agent integration

Tools: `list_metadata_fields`, `create_metadata_field`, `update_metadata_field`, and `set_athlete_metadata`. Existing `get_athlete`, `list_athletes`, and `list_pending_invites` support optional metadata. `get_athlete` also supports paginated history.

`ask_question` accepts a schema-validated `metadataEditor`:

```json
{"mode":"fields"}
```

or:

```json
{"mode":"athlete","athleteId":"<athlete UUID>"}
```

Chat renders the same editors as the normal pages. Saves are explicit, authenticated API operations. Continue resumes the question; the agent rereads current data before continuing the original task. Cancel prevents further actions but does not undo explicitly saved profile edits. Historical cards close instead of displaying stale forms as current data. `scripts/check-question-schema.mjs` checks the Eve patch against the shared presentation schema.

Roster filters are AND-combined and execute in PostgreSQL before pagination. Values can be included separately. Supported operations include equality, text contains, numeric/date bounds, select any/all, missing/answered, and inclusive birth-date age ranges as of today or an explicit date. Missing/invalid answers do not match ordinary filters. Assignment remains an explicit snapshot of reviewed athlete IDs; all result pages must be read before a bulk action.

## Validation

From `forge-next`, run the metadata Vitest tests and Eve/Next builds using the normal package scripts. From the repository root, run:

```sh
node scripts/check-question-schema.mjs
node scripts/test-athlete-metadata.mjs <local-postgres-container>
```

The database test creates and removes a disposable database. It tests the real linking RPCs and new migration under authenticated roles, permissive default grants, cross-coach/athlete access, version conflicts, transaction rollback, history, unit conversion, age boundaries, and a roster larger than 100 athletes.

See [QA.md](./QA.md) for authenticated UI and agent checks. The checked-in migration must be applied to the QA database before using the feature; implementation work does not apply migrations to a hosted project.
