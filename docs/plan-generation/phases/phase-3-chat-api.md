# Phase 3 — Chat API + AI Gateway

**Goal:** Authenticated coach endpoint that streams assistant text, emits run/artifact/warning/error events, and orchestrates **draft file tools** + sandbox + validation — without DB plan writes.

**Depends on:** Phase 2 (Storage + `listDraftUploads`), Phase 4 (sandbox) for full E2E — **stub sandbox OK** for early API tests

**Blocks:** Phase 5 (client consumes stream)

---

## Agent actions

- [x] Add `app/api/coach/plan-chat/route.ts` with `requireApiRole('coach')`
- [x] Accept JSON body:
  - `draftId` — ties to Storage prefix when uploads exist
  - `prompt` (serialized prompt document text)
  - `currentArtifact` (optional) — **sandbox seed only; never in LLM messages**
  - `messages` (optional thread)
- [x] Implement `lib/plans/summarize-plan.ts` — short text for iterations
- [x] **Three model tools** (model chooses order; no server-forced turns):
  - `list_draft_files` — returns `paths[]` under `{coachId}/{draftId}/`
  - `read_draft_file` — `loadUploadContextById()` for one normalized `.txt`
  - `submit_plan_code` — Python for `run.py`; sandbox runs **only if** this tool was called
- [x] Prompts under `lib/ai/plan-chat/prompts/`
- [x] **Do not** preload full upload text into the first message
- [x] Streaming: `assistantTextDelta`; discrete `runStatus`, `artifact`, `warnings`, `errors`
- [x] Dev: log submitted Python in Next.js server terminal

---

## Clarification (XLSX / ambiguous context)

Handled by the **model** via tools, not upload blocking:

1. `list_draft_files` returns paths for all sheets
2. Model may ask which sheet and **omit** `submit_plan_code` → `done`, no `artifact`
3. Next message: `read_draft_file` + `submit_plan_code` when ready

---

## Done criteria

- [x] Unauthenticated → 401; athlete → 403
- [x] Prompt-only → `artifact` when model submits code
- [x] Multi-sheet XLSX → `list_draft_files` lists all paths; agent can clarify
- [x] `currentArtifact` seeds sandbox only — not full JSON in system prompt (unit test)
- [ ] Sandbox filesystem has no upload copies (Phase 4 integration assert)
