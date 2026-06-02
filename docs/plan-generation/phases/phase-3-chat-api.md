# Phase 3 — Chat API + AI Gateway

**Goal:** Authenticated coach endpoint that streams assistant text only, emits non-streamed run/artifact/warning/error events, and orchestrates sandbox + validation — without DB plan writes.

**Depends on:** Phase 1 (Gateway deps), Phase 2 (Storage + normalization), Phase 4 (sandbox) for full E2E — **stub sandbox OK** for early API tests

**Blocks:** Phase 5 (client consumes stream)

---

## Agent actions

- [ ] Add `app/api/coach/plan-chat/route.ts` with `requireRole('coach')`
- [ ] Accept JSON body:
  - `prompt` (JSON segments — reuse `serializePromptDocument`)
  - `currentArtifact` (optional) — **sandbox seed only; never in LLM messages**
  - `messages` (optional thread)
  - `contextFileIds` (optional — load normalized text from Storage)
- [ ] Implement `lib/plans/summarize-plan.ts` — short text summary for Gateway (weeks, days, exercise names); used on iterations, not full JSON
- [ ] Pipeline order:
  1. Load upload context from Storage by id (if any)
  2. If XLSX needs sheet clarification → stream assistant question, return early (no sandbox)
  3. Build Gateway messages: system (rules + short `forge_plan` cheat sheet) + user prompt + upload appendix + `summarizePlan` when artifact exists
  4. Gateway: generate assistant reply (stream tokens) + generated Python (`run.py` body)
  5. Sandbox: write `current_plan.json` + `forge_plan/` + `run.py` only → execute → read `output/plan.json`
  6. `loadWorkoutPlan()` → emit `artifact` or `errors`
- [ ] Streaming contract:
  - **Stream:** `assistantTextDelta` only
  - **Non-stream:** `runStatus`, `artifact`, `warnings`, `errors`
- [ ] Keep modules in `lib/ai/plan-chat/` (prompts, orchestration, event types) — not in route file
- [ ] Unit tests: prompt assembly excludes full artifact JSON, event serialization, auth rejection
- [ ] Integration test with mocked sandbox runner

---

## Developer actions

- [ ] Set `AI_GATEWAY_API_KEY` (or equivalent) in `.env.local` and Vercel project settings
- [ ] Choose default Gateway model(s) and share with agent
- [ ] Test route via `curl` or REST client with coach session cookie after implementation
- [ ] Verify preview deployment has same env vars as local

---

## Done criteria

- [ ] Unauthenticated → 401; athlete session → 403
- [ ] Prompt-only request streams assistant text; valid `artifact` event after sandbox (non-streamed)
- [ ] Invalid sandbox output → `errors` event, no `artifact`; preview unchanged on client
- [ ] Multi-sheet XLSX without hint → clarification stream, no sandbox
- [ ] `currentArtifact` seeds sandbox but does not appear in Gateway request payload (assert in tests)
- [ ] `contextFileIds` load upload text into Gateway only; sandbox filesystem has no upload copies

---

## Clarification turn (XLSX)

When Phase 2 returns `needsSheetClarification`:

1. Stream a short assistant message listing sheet names
2. Emit `runStatus: done` (non-streamed)
3. Do not update artifact

User’s next message should include sheet name in prompt; re-upload or re-normalize with hint.
