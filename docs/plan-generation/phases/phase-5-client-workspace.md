# Phase 5 — Client workspace

**Goal:** Evolve **coach home** into split UI — chat thread, streaming assistant text, non-streamed run/artifact updates, in-memory preview — wired to Phase 3 API.

**Depends on:** Phase 3 (streaming contract + `draftId`)

**Can start in parallel:** Static layout + state types before API is done (mock events)

---

## Agent actions

- [ ] Evolve `app/coach/(app)/page.tsx` + `CoachHomePrompt` — split pane on **coach home** (v1)
- [ ] Reusable primitives in `components/ui/` (`ChatBubble`, `RunStatusBadge`, etc.)
- [ ] Feature composition in `components/coach/plan-chat/`:
  - `PlanChatThread`, `PlanChatRunStatus`, `PlanChatPreview` (`PlanViewer`)
- [ ] Client state (`lib/plan-chat/state.ts` or equivalent):
  - `messages`, `currentArtifact`, `runStatus`, `warnings`, `errors`
  - **`draftId`** — client UUID per workspace session (Storage prefix)
  - `contextFileIds[]` — all ids returned from upload (length may exceed file picker count for XLSX)
- [ ] Attach flow:
  1. `POST /api/coach/upload-context` with `FormData`: `draftId`, `files[]`
  2. On **200**: show attachments as uploaded (including multi-sheet workbook — e.g. “Spreadsheet (3 sheets)”)
  3. **Do not** treat multi-sheet XLSX as failed attach
- [ ] Send flow:
  - `POST /api/coach/plan-chat` with `draftId`, `prompt`, `currentArtifact`, `messages`
- [ ] Stream `assistantTextDelta`; apply `artifact` / `runStatus` / `warnings` / `errors`
- [ ] Sheet/file clarification appears in **thread** (from assistant), not as upload error
- [ ] On validation error: keep last valid `currentArtifact`
- [ ] Loading / empty / error states per AGENTS.md
- [ ] Component tests: run status mapping; preview not replaced on invalid artifact

---

## Developer actions

- [ ] UX review: desktop split / mobile stack
- [ ] Accessibility: live region for streaming text

---

## Done criteria

- [ ] Prompt-only from coach home updates preview
- [ ] Attach CSV / PDF / multi-sheet XLSX → all succeed on upload; preview updates after successful plan-chat run
- [ ] Multi-sheet: user sees clarification in chat when agent asks (not 422 on attach)
- [ ] Run lifecycle visible in UI
- [ ] Refresh clears in-memory draft (expected v1)

---

## Navigation (v1)

| Surface | Behavior |
| --- | --- |
| Coach home `/coach` | Composer + thread + preview |
| Sidebar | No separate “New plan” route for v1 |
