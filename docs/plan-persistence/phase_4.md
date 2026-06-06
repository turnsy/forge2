# Phase 4 — Version history list

**Status:** Done

## Goal

Display version history on the plan detail page (list only).

## Scope

### UI

- `CoachPlanDetailView` toggles between plan and history views
- **History** button beside **Edit** — version list hidden until toggled
- `PlanVersionHistory` — each row: created date, change summary (or "—" if null), active badge; newest first

### Data

- Server: `listCoachPlanVersions` in detail page loader
- `GET /api/coach/plans/[planId]/versions` also available for client fetch

## Files

| File | Action |
| --- | --- |
| `forge-next/components/plan/plan-version-history.tsx` | New |
| `forge-next/components/plan/coach-plan-detail-view.tsx` | New |
| `forge-next/app/coach/(app)/plans/[planId]/page.tsx` | Wire detail view |

## Done criteria

- [x] Versions listed on detail page
- [x] Active version indicated
- [x] Empty state when only one version (still shows it)
