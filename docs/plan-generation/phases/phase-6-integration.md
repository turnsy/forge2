# Phase 6 — Integration & QA

**Goal:** End-to-end v1 matches [overview.md](../overview.md) done definition; tests and docs complete for merge.

**Depends on:** Phases 1–5

---

## Task 1 — Janitorial (consolidation, cleanup, docs) ✅

- [x] Dead code removed (`coach-home-prompt`, `attached-file-list`, `run-status-badge`, unused plan-chat barrel)
- [x] Plan client adapter at `lib/chat/adapters/plan/`; upload naming generalized (`session-uploads`, `list_session_files`)
- [x] SSE parsing consolidated (`readSseStream` + shared `parseSseJsonLine` in `lib/chat/parse-sse.ts`)
- [x] `draftId` → **`sessionId`** (required on upload + plan-chat)
- [x] Sandbox stub comments updated (CI/test harness only)
- [x] Docs aligned — [code-map.md](../code-map.md), phases 3–5, overview, README
- [x] [task-2-edge-case-testing.md](../task-2-edge-case-testing.md) written

---

## Task 2 — Edge case testing ([spec](../task-2-edge-case-testing.md)) ✅

- [x] Integration test: attach → multi-sheet → plan-chat clarify + generate paths
- [x] Unit: `read_session_file`, validation gate, sandbox failure
- [x] Route tests: athlete 403, upload handler edge cases
- [x] CI: `pnpm test:forge-plan`

---

## Agent actions (remaining)

- [x] Happy path wired (real sandbox in prod; stub for CI/tests only)
- [x] Integration test (Task 2)
- [x] Unit coverage: uploads multi-sheet, `list_session_files`, `read_session_file`, validation gate
- [x] `docs/plan-generation/QA.md` manual checklist (exists)
- [x] CI: `pnpm test` + `pnpm build` (mock sandbox; no secrets)

---

## Developer actions

- [ ] Manual QA with real Sandbox + Gateway ([QA.md](../QA.md))
- [ ] Preview deployment with production env vars
- [ ] Sign off v1 vs [out of scope](../overview.md#out-of-scope-v1)

---

## Done criteria (v1 ship)

- [x] All Phase 1–5 agent done criteria checked
- [x] CI green (incl. Task 2 agent items)
- [ ] Manual QA signed off
- [x] No DB writes in plan-chat path
- [x] Sandbox has no upload/context files (`run-plan.test.ts`)

---

## Post-v1 backlog

| Item | Owner |
| --- | --- |
| Persist draft / `plan_versions` | Done — see `set_current_artifact`, `list_plans`, `list_plan_versions` |
| Load plan by `planId` | Done — see `set_current_artifact` |
| Intent router | TBD |
| **Plan** JSON traversal / glimpse tools (distinct from upload file list/read) | TBD |
| Validation repair loop | TBD |
| Agent tools to edit an athlete's in-progress **assigned** plan (distinct from the draft/template) | [Phase 8 design](./phase-8-assigned-plan-edit-tools.md) — TBD |
| Athlete flows | TBD |
| Plan-chat SSE `warnings` (forward upload truncation) | TBD |
