# Phase 2 — Domain layer (`lib/links`)

**Status:** ✅ Done

**Goal:** Typed repository, errors, and server actions wrapping link RPCs.

**Depends on:** Phase 1

**Blocks:** Phases 3–6

---

## Agent actions

- [x] `forge-next/lib/links/types.ts` — `AthleteCoachLink`, `PendingInvite`, action result types
- [x] `forge-next/lib/links/errors.ts` — domain error codes + user-facing messages
- [x] `forge-next/lib/links/repository.ts` — Supabase RPC wrappers
- [x] `forge-next/lib/links/actions.ts` — `"use server"` actions with `revalidatePath`
- [x] `forge-next/lib/links/repository.test.ts` — row mapping + error handling tests

---

## Done criteria

- [x] All RPCs callable from repository with typed results
- [x] Unit tests pass for mapping and error normalization
