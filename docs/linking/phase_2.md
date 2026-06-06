# Phase 2 — Save from preview (create mode)

**Status:** Done

## Goal

Wire the artifact toolbar Save button in create mode: persist plan, redirect to detail page.

## Scope

### Client

- `lib/plans/save-plan-client.ts` — `createCoachPlan`, `saveCoachPlanVersion` fetch helpers
- `lib/plans/use-save-plan.ts` — hook: loading, error, save handler
- `ArtifactToolbar` — `onSave`, `saveLoading` props
- `CoachWorkspace` — wire save in create mode (`planId` absent)

### Behavior

1. Save disabled while chat running or no artifact
2. Merge toolbar title into plan before POST
3. On success: `router.push(/coach/plans/${planId})`
4. Show inline error on failure

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/plans/save-plan-client.ts` | New |
| `forge-next/lib/plans/use-save-plan.ts` | New |
| `forge-next/components/artifact/artifact-toolbar.tsx` | Extend |
| `forge-next/components/coach/coach-workspace.tsx` | Wire save |

## Done criteria

- [ ] Save creates plan via API
- [ ] Redirect to plan detail on success
- [ ] Save disabled during chat run / without artifact
- [ ] Tests for toolbar + save hook
