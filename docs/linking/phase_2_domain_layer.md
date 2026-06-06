# Phase 2 — Domain layer (`lib/links`)

**Status:** ⏳ Pending

**Goal:** Typed repository, errors, and server actions wrapping link RPCs.

**Depends on:** Phase 1

**Blocks:** Phases 3–6

---

## Agent actions

- [ ] `forge-next/lib/links/types.ts` — `AthleteCoachLink`, `PendingInvite`, action result types
- [ ] `forge-next/lib/links/errors.ts` — domain error codes + user-facing messages
- [ ] `forge-next/lib/links/repository.ts` — Supabase RPC wrappers
- [ ] `forge-next/lib/links/actions.ts` — `"use server"` actions with `revalidatePath`
- [ ] `forge-next/lib/links/repository.test.ts` — row mapping + error handling tests

---

## Done criteria

- [ ] All RPCs callable from repository with typed results
- [ ] Unit tests pass for mapping and error normalization
