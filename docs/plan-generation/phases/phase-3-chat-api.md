# Phase 3 — Chat API + AI Gateway

**Goal:** Authenticated coach endpoint that streams assistant text, emits run status, and orchestrates sandbox + validation — without DB writes.

**Depends on:** Phase 1 (Gateway deps), Phase 2 (normalization), Phase 4 (sandbox) for full E2E — **stub sandbox OK** for early API tests

**Blocks:** Phase 5 (client consumes stream)

---

## Agent actions

- [ ] Add `app/api/coach/plan-chat/route.ts` with `requireRole('coach')`
- [ ] Accept `multipart/form-data`:
  - `prompt` (JSON segments or plain string — prefer reusing `serializePromptDocument`)
  - `currentArtifact` (optional JSON string)
  - `messages` (optional JSON array for thread)
  - `files[]`
- [ ] Pipeline order:
  1. Normalize uploads (Phase 2) → if `needsSheetClarification`, stream assistant question and **return early**
  2. Build system prompt: coach plan builder rules, schema version, output paths
  3. Call AI Gateway for **code generation** prompt (Python using `forge_plan` lib) OR single orchestration model — document choice in code
  4. Invoke sandbox executor (Phase 4)
  5. Read `plan.json`, `loadWorkoutPlan()`
  6. Stream final events: `artifact` | `validationError`
- [ ] Use AI SDK streaming (`streamText` / custom data stream) with typed events:
  - `runStatus`: `parsing` | `generating` | `sandbox` | `validating` | `done` | `error`
  - `assistantTextDelta`
  - `artifact` (full JSON, only if valid)
  - `error` (structured)
- [ ] Keep modules in `lib/ai/plan-chat/` (prompts, orchestration, event types) — not in route file
- [ ] Unit tests: prompt assembly, event serialization, auth rejection for non-coach
- [ ] Integration test with **mocked** sandbox runner (optional until Phase 4 lands)

---

## Developer actions

- [ ] Set `AI_GATEWAY_API_KEY` (or equivalent) in `.env.local` and Vercel project settings
- [ ] Choose default Gateway model(s) and share with agent (e.g. one strong model for codegen)
- [ ] Test route via `curl` or REST client with coach session cookie after implementation
- [ ] Verify preview deployment has same env vars as local

---

## Done criteria

- [ ] Unauthenticated → 401; athlete session → 403
- [ ] Prompt-only request returns streamed assistant text + valid artifact event (with sandbox wired)
- [ ] Invalid sandbox output → `validationError` event, no `artifact` event
- [ ] Multi-sheet XLSX without hint → clarification stream, no sandbox run
- [ ] `currentArtifact` round-trips: second message mutates prior plan in sandbox seed file

---

## Clarification turn (XLSX)

When Phase 2 returns `needsSheetClarification`, API should:

1. Stream a short assistant message listing sheet names
2. Set `runStatus: done` without sandbox
3. Not update artifact

User’s next message should include sheet name in prompt; normalization re-runs with that hint.
