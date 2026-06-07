# Phase 4 — `set_current_artifact` + edit drop-in

**Status:** Not started

**Goal:** Let the agent load a saved plan into the workspace preview from chat, enabling split-pane edit without navigating away manually. Only this tool (and `submit_plan_code` success) sets `currentArtifact`.

**Depends on:** [phase_2.md](./phase_2.md) (`get_plan` loads full plan server-side for artifact)

**Blocks:** Phase 6 (split UI needs artifact), Phase 7 (edit-mode save semantics)

---

## Scope

### `set_current_artifact` tool

- [ ] Input: `planId: string`
- [ ] Server loads plan via `getCoachPlanById` (full `plan_data` — **server only**, not returned to LLM)
- [ ] Tool return to LLM: `{ ok: true, planId, name, summary: summarizePlan(plan) }` — no blob
- [ ] Side effect: emit workspace event to client with full validated `WorkoutPlan`

### SSE / client event

- [ ] New SSE event type: `setArtifact` (or reuse `artifact` with `source: "loaded"`)
  - Payload: `{ plan: WorkoutPlan, planId: string, title: string }`
- [ ] Client `applyChatEvent` handles event → sets `currentArtifact`, `artifactTitle`, `planId`
- [ ] Triggers split-pane layout (Phase 6) when artifact arrives

### Edit-mode semantics from chat

- [ ] After `set_current_artifact`, workspace behaves like edit mode:
  - [ ] `planId` tracked in workspace state
  - [ ] Save uses version API (`saveCoachPlanVersion`) not create
  - [ ] Back link to `/coach/plans/[planId]` available
- [ ] `get_plan` and `assign_plan` do **not** set artifact (only this tool + sandbox success)

### URL strategy (optional in this phase)

- [ ] Consider `router.replace('/coach/plans/[planId]/edit')` when artifact loaded from chat
- [ ] Or defer URL update to Phase 7 (save redirect) — document chosen approach

### Orchestrator

- [ ] `set_current_artifact` execute callback invokes `input.emit({ type: 'setArtifact', ... })`
- [ ] Does not interrupt current turn streaming

### Tests

- [ ] Tool unit test: loads plan, returns summary only
- [ ] Integration test: SSE event emitted with validated plan
- [ ] Client reducer test: `setArtifact` updates state correctly

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/coach-agent/tools/artifact-tools.ts` | New |
| `forge-next/lib/ai/plan-chat/types.ts` | Extend SSE event types |
| `forge-next/lib/ai/plan-chat/events.ts` | Encode new event |
| `forge-next/lib/ai/plan-chat/orchestrator.ts` | Wire artifact tool + emit |
| `forge-next/lib/chat/apply-chat-event.ts` | Handle `setArtifact` |
| `forge-next/lib/chat/types.ts` | Extend `ChatEvent` union |
| `forge-next/lib/chat/adapters/plan/map-plan-wire-event.ts` | Map wire → client event |
| `forge-next/lib/chat/adapters/plan/use-coach-plan-workspace.ts` | Track `planId` in state |

---

## Done criteria

- [ ] Agent can load a saved plan into preview via tool call
- [ ] LLM never receives full plan JSON from this tool
- [ ] `get_plan` / `assign_plan` do not set preview
- [ ] Workspace tracks `planId` after load for version saves
- [ ] Tests cover tool + client state update
