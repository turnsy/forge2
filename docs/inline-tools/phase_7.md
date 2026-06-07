# Phase 7 — Post-create save (stay on `/coach`)

**Status:** Not started

**Goal:** After first save in create flow, **stay on `/coach`** with internal `planId` set. Conversation and artifact are untouched. Subsequent saves use the version API.

**Depends on:** [phase_4.md](./phase_4.md) (`planId` tracking pattern), [phase_6.md](./phase_6.md) (split layout)

**Blocks:** Phase 8 QA

---

## Scope

### Current behavior (to change)

- Create save → `router.push('/coach/plans/[planId]')` → leaves workspace, loses chat

### Target behavior

- First save (create) → **no navigation**; remain on `/coach`
- After save:
  - [ ] Same `currentArtifact` and `artifactTitle`
  - [ ] Same `messages` thread
  - [ ] Same `sessionId` (upload tools keep working)
  - [ ] `planId` set in workspace state from create response
  - [ ] `useSavePlan(planId)` switches to version API for subsequent saves
  - [ ] Back link to `/coach/plans/[planId]` appears
  - [ ] `savedSnapshotRef` initialized post-save
  - [ ] Unsaved-changes confirm on back link (same as edit mode)

### Save hook changes

- [ ] `useSavePlan`: after create success, return `{ planId, versionId }` without redirecting
- [ ] `CoachWorkspace.handleSave`:
  - [ ] Create mode first save: set `planId` in state, update `savedSnapshotRef`, show back link — **no `router.push`**
  - [ ] Subsequent saves on `/coach`: version API via `useSavePlan(planId)`
  - [ ] Edit route (`/coach/plans/[id]/edit`): unchanged
- [ ] `resetSaveStatus` on send still applies when in edit-like state on `/coach`

### Workspace state

- [ ] Extend plan workspace state with optional `planId: string | null`
- [ ] `planId` also set by `set_current_artifact` (Phase 4) — same semantics
- [ ] Create mode promotes to “persisted edit” semantics without route change

### Tradeoffs (accepted)

- URL stays `/coach` — does not reflect which plan is being edited
- Page refresh mid-session loses in-memory chat/artifact (no sessionStorage snapshot)
- Direct entry to edit a saved plan remains `/coach/plans/[id]/edit` with empty chat + preloaded plan

### Tests

- [ ] `handleSave` create path: no router navigation; `planId` set in state
- [ ] Second save on `/coach` calls version API not create API
- [ ] Back link renders after first save
- [ ] `savedSnapshotRef` + unsaved guard work post-save

---

## Files

| File | Action |
| --- | --- |
| `forge-next/components/coach/coach-workspace.tsx` | Save logic, back link on `/coach`, remove redirect |
| `forge-next/lib/plans/use-save-plan.ts` | Return planId on create |
| `forge-next/lib/chat/adapters/plan/use-coach-plan-workspace.ts` | Track `planId` in state |
| `forge-next/lib/chat/types.ts` | Optional `planId` on workspace state |
| `forge-next/components/coach/coach-workspace.test.tsx` | New/extend |

---

## Done criteria

- [ ] First save stays on `/coach` with conversation retained
- [ ] `planId` set internally after first save
- [ ] Subsequent saves use version API
- [ ] Back link + unsaved guard work on `/coach` post-save
- [ ] `docs/plan-persistence/README.md` decision table updated (create save stays on `/coach`)

### Docs update

- [ ] Update plan-persistence README: create save → stay on `/coach`, set internal `planId` (not redirect to detail or edit)
