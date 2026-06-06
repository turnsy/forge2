# Phase 5 — Client workspace

**Goal:** Coach home split UI — chat thread, streaming assistant text, non-streamed run/artifact updates, in-memory preview — wired to Phase 3 API.

**Depends on:** Phase 3 (streaming contract + `sessionId`)

---

## Agent actions

- [x] `app/coach/(app)/page.tsx` → `CoachWorkspace` with `ResizableSplitPane` on **coach home** (v1)
- [x] Shared primitives in `components/ui/` (`ChatBubble`, `ResizableSplitPane`, …)
- [x] Chat composition in `components/chat/` + `components/artifact/`:
  - `ChatThread`, inline run status, `ArtifactPreview` → `PlanViewer`
- [x] Client state in `lib/chat/` + `lib/plan-chat/use-coach-plan-workspace.ts`:
  - `messages`, `currentArtifact`, `runStatus`, `warnings`, `errors`
  - **`sessionId`** — client UUID per workspace session (required on API)
  - `contextFileIds[]` — ids returned from upload (may exceed file count for XLSX)
- [x] Attach flow:
  1. `POST /api/coach/upload-context` with `FormData`: `sessionId`, `files[]`
  2. On **200**: show attachments as uploaded (multi-sheet label via `formatAttachmentDisplayLabel`)
  3. **Do not** treat multi-sheet XLSX as failed attach
- [x] Send flow: `POST /api/coach/plan-chat` with `sessionId`, `prompt`, `currentArtifact`, `messages`
- [x] Stream `assistantTextDelta`; apply `artifact` / `runStatus` / `errors`
- [x] Sheet clarification in **thread** (from assistant), not as upload error
- [x] On validation error: keep last valid `currentArtifact`
- [x] Loading / empty / error states per AGENTS.md
- [x] Tests: `lib/chat/apply-chat-event.test.ts`, `lib/chat/reducer.test.ts`, `components/artifact/artifact-preview.test.tsx`

---

## Developer actions

- [ ] UX review: desktop split / mobile stack
- [ ] Accessibility: live region for streaming text

---

## Done criteria

- [x] Prompt-only from coach home updates preview (code complete; manual sign-off in QA.md)
- [x] Attach CSV / PDF / multi-sheet XLSX → upload succeeds; preview after successful plan-chat
- [x] Multi-sheet: clarification in chat when agent asks
- [x] Run lifecycle visible in UI
- [x] Refresh clears in-memory session (expected v1)

---

## Navigation (v1)

| Surface | Behavior |
| --- | --- |
| Coach home `/coach` | Composer + thread + preview |
| Sidebar | No separate “New plan” route for v1 |
