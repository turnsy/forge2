# Phase 3 — Chat API + AI Gateway

**Goal:** Authenticated coach endpoint that streams assistant text, emits run/artifact/warning/error events, and orchestrates **draft file tools** + sandbox + validation — without DB plan writes.

**Depends on:** Phase 2 (Storage + `listDraftUploads`), Phase 4 (sandbox) for full E2E — **stub sandbox OK** for early API tests

**Blocks:** Phase 5 (client consumes stream)

---

## Agent actions

- [ ] Add `app/api/coach/plan-chat/route.ts` with `requireApiRole('coach')`
- [ ] Accept JSON body:
  - `draftId` — **required** when the workspace has uploads (ties to Storage prefix)
  - `prompt` (JSON segments — reuse `serializePromptDocument`)
  - `currentArtifact` (optional) — **sandbox seed only; never in LLM messages**
  - `messages` (optional thread)
  - `contextFileIds` (optional) — narrow scope; if omitted, tools list entire `{coachId}/{draftId}/` prefix
- [ ] Implement `lib/plans/summarize-plan.ts` — short text for iterations
- [ ] **Draft context tools** (AI SDK — model-invoked only):
  - `list_draft_files` — wraps `listDraftUploads()` → filenames under bucket prefix
  - `read_draft_file` — `loadUploadContextById()` for one normalized `.txt`
- [ ] **Sandbox is not a model tool** — the route orchestrator decides when to run it (see below)
- [ ] Pipeline order (server state machine in `lib/ai/plan-chat/`, not “model picks sandbox”):
  1. **Context turn:** Gateway with `list_draft_files` / `read_draft_file` only. Model may stream clarification (“which sheet?”). If still ambiguous → `runStatus: done`, no sandbox.
  2. **Codegen turn:** When the orchestrator has enough context (user named a file/sheet, or only one draft object, or explicit `contextFileIds`), server starts a **separate** Gateway call with a codegen system prompt + `summarizePlan` (no draft tools). Model streams assistant text + returns generated Python.
  3. **Sandbox step:** Server writes `current_plan.json` + `forge_plan/` + `run.py`, runs Vercel Sandbox, reads `output/plan.json` — emits `runStatus: sandbox` then `validating`.
  4. **`loadWorkoutPlan()`** → emit `artifact` or `errors`
- [ ] **Do not** preload full upload text into the first message (no giant appendix)
- [ ] Streaming contract unchanged: stream `assistantTextDelta`; non-stream `runStatus`, `artifact`, `warnings`, `errors`
- [ ] Keep orchestration in `lib/ai/plan-chat/` (tools, prompts, events)
- [ ] Unit tests: tools list multi-sheet draft; auth; no full artifact JSON in tool-less system prompt
- [ ] Integration test with mocked sandbox + mocked Storage list

---

## Developer actions

- [ ] Set `AI_GATEWAY_API_KEY` in `.env.local` and Vercel project settings
- [ ] Choose default Gateway model(s) with **tool calling** support
- [ ] Test with coach session: attach files → send plan-chat with `draftId`

---

## Done criteria

- [ ] Unauthenticated → 401; athlete → 403
- [ ] Prompt-only request streams assistant text; valid `artifact` after sandbox
- [ ] Multi-sheet XLSX attached under one `draftId` → `list_draft_files` shows all `__sheet` objects; agent can ask in thread
- [ ] Upload attach never blocked for multiple sheets (Phase 2)
- [ ] `currentArtifact` seeds sandbox only — not in Gateway payload (assert in tests)
- [ ] Sandbox filesystem has no upload copies

---

## Clarification (XLSX / ambiguous context)

Handled in **plan-chat** by the **model** (not upload, not server step gating):

1. `list_draft_files` returns e.g. `workbook__summary.txt`, `workbook__volume.txt`
2. Model may stream “Which sheet should I use?” and **omit** `submit_plan_code` → `runStatus: done`, no `artifact`
3. User’s next message: model calls `read_draft_file` and `submit_plan_code` when ready

The server never runs sandbox unless `submit_plan_code` was invoked. Whether to clarify vs generate is entirely the model’s call.

No Phase 2 `needsSheetClarification` response.
