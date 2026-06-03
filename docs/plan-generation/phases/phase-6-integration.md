# Phase 6 — Integration & QA

**Goal:** End-to-end v1 matches [overview.md](../overview.md) done definition; tests and docs complete for merge.

**Depends on:** Phases 1–5

---

## Agent actions

- [ ] Remove sandbox/API stubs; wire happy path
- [ ] Integration test: attach → multiple sheet ids → plan-chat `list_draft_files` → clarify or sandbox (mocked)
- [ ] Unit coverage: uploads (multi-sheet ids), draft list/read tools, validation gate
- [ ] `docs/plan-generation/QA.md` manual checklist
- [ ] CI: `pnpm test` + `pnpm build` (mock sandbox; no secrets)

---

## Developer actions

- [ ] Manual QA with real Sandbox + Gateway:
  - [ ] Prompt-only create / iterate
  - [ ] CSV, PDF, multi-sheet XLSX (attach shows success; agent may ask sheet in chat)
  - [ ] Invalid sandbox output → error UI, preview unchanged
- [ ] Preview deployment with production env vars
- [ ] Sign off v1 vs [out of scope](../overview.md#out-of-scope-v1)

---

## Done criteria (v1 ship)

- [ ] All Phase 1–5 done criteria checked
- [ ] CI green
- [ ] Manual QA signed off
- [ ] No DB writes in plan-chat path
- [ ] Sandbox has no upload/context files

---

## Post-v1 backlog

| Item | Owner |
| --- | --- |
| Persist draft / `plan_versions` | TBD |
| Load plan by `planId` | TBD |
| Intent router | TBD |
| **Plan** JSON traversal / glimpse tools (distinct from draft file list/read) | TBD |
| Validation repair loop | TBD |
| Athlete flows | TBD |
