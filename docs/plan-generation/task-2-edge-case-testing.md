# Task 2 — Edge case testing & CI hardening

Follows [Phase 6 Task 1](./phases/phase-6-integration.md) (consolidation, cleanup, doc alignment, `sessionId` rename).

**Goal:** Close test gaps and harden CI without changing product behavior (except tests).

---

## P0 — Phase 6 defining tests

### Integration: `lib/ai/plan-chat/plan-generation.integration.test.ts`

Single Vitest file, **no HTTP**, mocked Gateway + mocked sandbox + mocked Storage.

| Case | Flow | Assert |
| --- | --- | --- |
| **Clarify path** | Multi-sheet XLSX via `normalizeMessageUploads` → 2+ `contextFileIds` → `runPlanChat` with matching `sessionId` → mocked Gateway calls `list_session_files`, assistant text only, **no** `submit_plan_code` | `runSandbox` not called; no `artifact`; final `runStatus: done` |
| **Generate path** | Same upload setup → Gateway calls `read_session_file` + `submit_plan_code` → mocked sandbox returns valid plan | Event sequence includes `sandbox` → `validating` → `artifact` → `done` |

### Unit gaps

| File | Cases |
| --- | --- |
| `lib/ai/plan-chat/tools/create-plan-chat-tools.test.ts` | `read_session_file`: success, truncation, `FILE_NOT_FOUND` |
| `lib/ai/plan-chat/orchestrator.test.ts` | Post-sandbox `loadWorkoutPlan` failure → `errors`, no `artifact`; sandbox `{ ok: false }` → same |
| `lib/chat/adapters/plan/parse-plan-chat-sse.test.ts` | `readPlanChatSseStream` end-to-end with encoded chunks |

---

## P1 — Route & upload hygiene

| File | Cases |
| --- | --- |
| `app/api/coach/plan-chat/route.test.ts` | Athlete → 403; missing `sessionId` → 400 |
| `app/api/coach/upload-context/route.test.ts` | Athlete → 403; multi-sheet XLSX → 2+ ids (real handler, mock storage) |
| `lib/uploads/upload-context-handler.test.ts` | **New** — missing `sessionId`, no files → `PARSE_FAILED` |
| `lib/uploads/normalize-message-uploads.test.ts` | Truncated CSV → `warnings` on success response |
| `lib/chat/apply-chat-event.test.ts` | `warnings` event appends to `state.warnings` (plumbing; SSE `warnings` deferred for v1) |

---

## P2 — CI

Add to `.github/workflows/ci.yml` after `pnpm test`:

```yaml
- name: forge_plan Python tests
  run: pnpm test:forge-plan
```

Keep `RUN_SANDBOX_INTEGRATION=1` **opt-in** locally only.

---

## Explicitly deferred (document, do not implement in Task 2)

| Item | Notes |
| --- | --- |
| Plan-chat SSE `warnings` emission | Upload warnings stay on upload HTTP response only ([overview](./overview.md)) |
| Playwright / browser E2E | Out of v1 scope |
| `sessionId` mismatch across upload vs chat | Prevented by client; no server cross-check needed in v1 |

---

## Done when

- [x] P0 tests merged and green
- [x] P1 tests merged (or explicitly descoped with reason)
- [x] `pnpm test:forge-plan` in CI
- [x] Phase 6 agent checkboxes updated in [phase-6-integration.md](./phases/phase-6-integration.md)
