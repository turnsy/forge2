# Phase 1 — Persistence layer

**Status:** Done

## Goal

Add database RPCs and server-side write paths for creating plans and saving new versions.

## Scope

### Supabase migration

- `create_coach_plan(p_plan_data, p_change_summary)` — insert `plans` + `plan_versions`, set `active_version_id`
- `save_coach_plan_version(p_plan_id, p_plan_data, p_change_summary)` — append version, update active pointer
- `list_coach_plan_versions(p_plan_id)` — versions for coach-owned plan, newest first

All RPCs use `security definer` + `auth.uid()` ownership checks.

### Repository (`lib/plans/`)

- `mutations.ts` — `createCoachPlan`, `saveCoachPlanVersion`
- Extend `repository.ts` — `listCoachPlanVersions`
- `mergePlanTitle(plan, title)` — apply toolbar title to `plan_data.name`
- `preparePlanForSave(plan, title)` — validate + merge title

### API routes

- `POST /api/coach/plans` — create
- `POST /api/coach/plans/[planId]/versions` — save edit
- `GET /api/coach/plans/[planId]/versions` — list versions

### Tests

- Unit: mappers, `preparePlanForSave`, mutation error mapping
- Route: auth, validation errors, happy path (mocked repo)

## Files

| File | Action |
| --- | --- |
| `supabase/migrations/*_coach_plan_mutations.sql` | New |
| `forge-next/lib/plans/mutations.ts` | New |
| `forge-next/lib/plans/prepare-plan-for-save.ts` | New |
| `forge-next/lib/plans/repository.ts` | Extend |
| `forge-next/app/api/coach/plans/route.ts` | Add POST |
| `forge-next/app/api/coach/plans/[planId]/versions/route.ts` | New |

## Done criteria

- [x] RPCs migrated
- [x] Repository write + list version functions
- [x] API routes with coach auth + schema validation
- [x] Unit and route tests passing
