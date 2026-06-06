# Phase 6 — Unlink

**Status:** ⏳ Pending

**Goal:** Coach unlinks from athlete detail; athlete unlinks from centered `/athlete` view.

**Depends on:** Phases 4–5

---

## Agent actions

- [ ] `/coach/athletes/[athleteId]` — load active relationship, unlink button
- [ ] Athlete active view — centered unlink button wired to `unlinkCoachAthlete`
- [ ] Both paths call same repository/action; `revalidatePath` both surfaces

---

## Done criteria

- [ ] Either party unlink removes athlete from coach active list
- [ ] Athlete returns to invite code input after unlink
- [ ] Re-request with same code works
