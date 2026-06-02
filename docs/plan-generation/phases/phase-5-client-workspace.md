# Phase 5 — Client workspace

**Goal:** Evolve **coach home** into split UI — chat thread, streaming assistant text, non-streamed run/artifact updates, in-memory preview — wired to Phase 3 API.

**Depends on:** Phase 3 (streaming contract)

**Can start in parallel:** Static layout + state types before API is done (mock events)

---

## Agent actions

- [ ] Evolve `app/coach/(app)/page.tsx` + `CoachHomePrompt` — split pane on the **existing home route** (no new `/plans/create` route for v1)
- [ ] Reusable primitives in `components/ui/` first (e.g. `ChatBubble`, `RunStatusBadge`) — per AGENTS.md
- [ ] Feature composition in `components/coach/plan-chat/`:
  - `PlanChatThread` — user/assistant messages (`ChatBubble`, not `ui/message` banner)
  - `PlanChatRunStatus` — maps `runStatus` to UI copy + spinner
  - `PlanChatPreview` — wraps existing `PlanViewer` with `currentArtifact`
- [ ] Client state (`useReducer` or Context in `lib/plan-chat/state.ts`):
  - `messages`
  - `currentArtifact: WorkoutPlan | null`
  - `runStatus`
  - `warnings`, `errors`
  - `draftId` (client UUID — ties to Storage path prefix)
- [ ] Attach flow:
  1. `POST /api/coach/upload-context` with `FormData` → `contextFileIds`
  2. `POST /api/coach/plan-chat` with prompt + ids + `currentArtifact`
- [ ] Stream `assistantTextDelta`; apply `artifact` / `runStatus` / `warnings` / `errors` from non-streamed events
- [ ] On validation error: keep **last valid** `currentArtifact`; show `errors` inline
- [ ] `@` mentions: render as today but **no routing**
- [ ] Loading / empty / error states per AGENTS.md
- [ ] Component tests: run status mapping, invalid artifact does not replace preview

---

## Developer actions

- [ ] UX review: split layout on coach home (desktop side-by-side, mobile stack)
- [ ] Accessibility pass on chat thread (live region for streaming text)

---

## Done criteria

- [ ] User can send prompt-only from coach home and see preview update
- [ ] User can attach CSV/PDF/XLSX and see preview update after successful run
- [ ] Run states visible through full lifecycle
- [ ] Clarification turn for multi-sheet XLSX works
- [ ] Refreshing page clears in-memory draft (expected v1)
- [ ] New UI primitives live under `components/ui/` where reusable

---

## Navigation (v1)

| Surface | Behavior |
| --- | --- |
| Coach home `/coach` | Composer + thread + preview on one page |
| Sidebar | No separate “New plan” route required for v1 |
