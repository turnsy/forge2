# Phase 4 — Version history list

**Status:** Done

## Goal

Display version history on the plan detail page (list only).

## Scope

### UI

- `PlanVersionHistory` component on detail page
- Each row: created date, change summary (or "—" if null), active badge
- Newest first

### Data

- Server: `listCoachPlanVersions` in detail page loader
- Or client fetch from `GET /api/coach/plans/[planId]/versions`

## Files

| File | Action |
| --- | --- |
| `forge-next/components/plan/plan-version-history.tsx` | New |
| `forge-next/app/coach/(app)/plans/[planId]/page.tsx` | Add history section |

## Done criteria

- [x] Versions listed on detail page
- [x] Active version indicated
- [x] Empty state when only one version (still shows it)
