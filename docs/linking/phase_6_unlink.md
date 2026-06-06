# Phase 6 — Unlink

**Status:** ✅ Done

**Goal:** Coach unlinks from athlete detail; athlete unlinks from centered `/athlete` view.

**Depends on:** Phases 4–5

---

## Agent actions

- [x] `/coach/athletes/[athleteId]` — load active relationship, unlink button
- [x] Athlete active view — centered unlink button wired to `unlinkCoachAthlete`
- [x] Both paths call same repository/action; `revalidatePath` both surfaces

---

## Done criteria

- [x] Either party unlink removes athlete from coach active list
- [x] Athlete returns to invite code input after unlink
- [x] Re-request with same code works
