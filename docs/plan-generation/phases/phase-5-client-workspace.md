# Phase 5 — Client workspace

**Goal:** Coach split UI — chat thread, streaming, run lifecycle, in-memory artifact preview — wired to Phase 3 API.

**Depends on:** Phase 3 (streaming contract)

**Can start in parallel:** Static layout + state types before API is done (mock stream)

---

## Agent actions

- [ ] New route under `app/coach/(app)/` — e.g. `plans/create/page.tsx` or `chat/page.tsx` (split pane)
- [ ] Components in `components/coach/plan-chat/`:
  - `PlanChatThread` — user/assistant messages (new `ChatMessage`, not `ui/message` banner)
  - `PlanChatRunStatus` — maps `runStatus` to UI copy + spinner
  - `PlanChatPreview` — wraps existing `PlanViewer` with `currentArtifact`
- [ ] Client state (`useReducer` or Context in `lib/plan-chat/state.ts`):
  - `messages`
  - `currentArtifact: WorkoutPlan | null`
  - `runStatus`
  - `warnings`, `errors`
  - optional `draftId` (client UUID only, no DB)
- [ ] Wire `CoachHomePrompt` send → navigate to workspace **or** embed composer in workspace (pick one; prefer dedicated workspace for thread history)
- [ ] Fix attach flow: retain `File` objects until send; `FormData` POST to API
- [ ] Consume AI SDK stream / SSE; update messages + artifact + run status from events
- [ ] On validation error: keep **last valid** `currentArtifact`; show error inline
- [ ] `@` mentions: render as today but **no routing**; optional footnote in UI “saved plan mentions coming soon”
- [ ] Loading / empty / error states per AGENTS.md
- [ ] Component tests for run status mapping and “invalid artifact does not replace preview”

---

## Developer actions

- [ ] UX review: route name, nav entry from coach sidebar/home
- [ ] Test on mobile width (split pane may stack vertically)
- [ ] Accessibility pass on chat thread (live region for streaming text)

---

## Done criteria

- [ ] User can send prompt-only and see preview update
- [ ] User can attach CSV/PDF/XLSX and see preview update after successful run
- [ ] Run states visible through full lifecycle
- [ ] Clarification turn for multi-sheet XLSX shows assistant question; reply with sheet name works
- [ ] Refreshing page clears draft (expected v1 — no persistence)

---

## Navigation suggestion

| From | To |
| --- | --- |
| Coach home “Send” | `/coach/plans/create` with initial prompt in state or query |
| Sidebar | “New plan” → same route |

Agent should align with existing `AppShell` / coach layout patterns.
