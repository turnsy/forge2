# Phase 7 — Save redirect with conversation retention

**Status:** Not started

**Goal:** After first save in create flow, redirect to `/coach/plans/[planId]/edit` while preserving the current chat thread and artifact state.

**Depends on:** [phase_4.md](./phase_4.md) (`planId` tracking), [phase_6.md](./phase_6.md) (split layout)

**Blocks:** Phase 8 QA

---

## Scope

### Current behavior (to change)

- Create save → `router.push('/coach/plans/[planId]')` → leaves workspace, loses chat

### Target behavior

- First save (create) → `router.replace('/coach/plans/[planId]/edit', { state? })` or equivalent
- User lands on edit route with:
  - [ ] Same `currentArtifact` and `artifactTitle`
  - [ ] Same `messages` thread
  - [ ] Same `sessionId` (upload tools keep working)
  - [ ] `planId` set for subsequent version saves
  - [ ] Back link to `/coach/plans/[planId]`
  - [ ] `savedSnapshotRef` initialized post-save

### Implementation options (pick one)

**Option A — Client state via sessionStorage**

- [ ] Before redirect, write workspace snapshot to `sessionStorage` keyed by `planId`
- [ ] Edit page `CoachWorkspace` hydrates from snapshot if present, then clears key
- [ ] Pros: simple, no API changes
- [ ] Cons: refresh after redirect still works only if snapshot read on mount

**Option B — URL search param + sessionStorage**

- [ ] `router.replace('/coach/plans/[id]/edit?continued=1')`
- [ ] Edit page detects param, restores chat from sessionStorage

**Option C — Keep user on `/coach` with internal planId (rejected)**

- User chose redirect to edit route

### Save hook changes

- [ ] `useSavePlan`: after create success, return `{ planId, versionId }` without assuming redirect
- [ ] `CoachWorkspace.handleSave`:
  - [ ] Create mode first save: persist chat state → `router.replace` to edit
  - [ ] Edit mode: unchanged (stay, update snapshot)
- [ ] `useSavePlan(planId)` switches to version API after `planId` known

### Edit page hydration

- [ ] `createEditPlanWorkspaceState` extended to accept optional `messages`, `sessionId` from continued session
- [ ] Default: empty chat + preloaded plan (current behavior)
- [ ] Continued: merge preloaded plan with restored messages

### Unsaved changes

- [ ] After redirect + hydrate, `savedSnapshotRef` matches saved state
- [ ] Back link confirm works on continued session

### Tests

- [ ] Unit: snapshot serialize/deserialize round-trip
- [ ] `handleSave` create path: mocks router.replace, asserts storage write
- [ ] Edit hydration: continued state restores messages

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/chat/workspace-snapshot.ts` | New — serialize/deserialize for redirect |
| `forge-next/components/coach/coach-workspace.tsx` | Save + redirect logic |
| `forge-next/lib/plans/use-save-plan.ts` | Return planId on create |
| `forge-next/lib/chat/adapters/plan/initial-state.ts` | Continued session hydration |
| `forge-next/app/coach/(app)/plans/[planId]/edit/page.tsx` | Read continued snapshot |
| `forge-next/lib/chat/workspace-snapshot.test.ts` | New |

---

## Done criteria

- [ ] First save redirects to `/coach/plans/[planId]/edit`
- [ ] Chat thread preserved across redirect
- [ ] Subsequent saves use version API
- [ ] Back link + unsaved guard work on continued session
- [ ] `docs/plan-persistence/README.md` decision table updated (create redirect target)

### Docs update

- [ ] Update plan-persistence README: create save → redirect to **edit** (not detail), retain chat
