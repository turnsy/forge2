# Phase 6 — Integration & QA

**Goal:** End-to-end v1 matches [overview.md](../overview.md) done definition; tests and docs complete for merge.

**Depends on:** Phases 1–5

---

## Agent actions

- [ ] Remove any sandbox/API stubs; single happy path wired
- [ ] E2E-style integration test (Vitest + mocked sandbox) covering: prompt-only → valid artifact event
- [ ] Expand unit coverage: uploads, validation gate, sandbox error mapping
- [ ] Add `docs/plan-generation/QA.md` manual checklist (copy of done criteria + sample prompts)
- [ ] Update `forge-next/README.md` (if present) or root README with link to plan-generation docs + env setup
- [ ] Ensure CI runs `pnpm test` and `pnpm build` with new deps (no secrets required in CI — mock sandbox)

---

## Developer actions

- [ ] Full manual QA on local with real Sandbox + Gateway:
  - [ ] Prompt-only create 4-week plan
  - [ ] Iterate: “add a deload week”
  - [ ] CSV from Google Sheets
  - [ ] PDF program
  - [ ] Multi-sheet XLSX → clarification → success
  - [ ] Invalid model output (if reproducible) → error UI, preview unchanged
- [ ] Preview deployment QA with production-like env vars
- [ ] Sign off v1 scope vs [overview out of scope](../overview.md#out-of-scope-v1)
- [ ] Open follow-up issues: DB save, saved-plan edit, intent router, plan glimpse tools

---

## Done criteria (v1 ship)

- [ ] All Phase 1–5 done criteria checked
- [ ] CI green
- [ ] Manual QA checklist signed off by developer
- [ ] No accidental DB writes to `plans` / `plan_versions` in plan-chat path (grep `.insert`, etc.)
- [ ] Storage uploads are ephemeral only; sandbox integration test asserts no `input_context` files

---

## Post-v1 backlog (tracking only)

| Item | Owner |
| --- | --- |
| Persist draft / save to `plan_versions` | TBD |
| Load plan by mention / `planId` for edits | TBD |
| Intent router (real branching) | TBD |
| Agent plan traversal / glimpse tools | TBD |
| Validation repair loop (auto re-run) | TBD |
| Athlete-facing flows | TBD |
