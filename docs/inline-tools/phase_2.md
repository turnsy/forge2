# Phase 2 — Read tools

**Status:** Done

**Goal:** Expose coach-scoped list and read database operations as AI tools. Never return full plan JSON blobs.

**Depends on:** [phase_1.md](./phase_1.md)

**Blocks:** Phases 3–5

---

## Done criteria

- [x] All six read tools registered in orchestrator
- [x] `list_athletes` and `list_plans` expose search via `q`
- [x] `get_plan` returns summary only — verified by test
- [x] Tools handle not-found and permission errors gracefully
- [x] No new Supabase migrations required
