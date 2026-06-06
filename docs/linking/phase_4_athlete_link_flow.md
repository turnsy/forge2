# Phase 4 — Athlete link flow

**Status:** ✅ Done

**Goal:** Athlete `/athlete` page handles three states: unlinked (code input), pending (wait + cancel), active (coach + unlink).

**Depends on:** Phase 2

**Blocks:** Phase 6 (unlink athlete side partially here)

---

## Agent actions

- [x] Server page loads `getAthleteCoachLink()`
- [x] `AthleteLinkForm` — invite code input → `requestCoachLink` action
- [x] `AthleteCoachLinkView` — pending: coach name + cancel; active: coach + unlink
- [x] No code input when status is `active` or `pending`

---

## Done criteria

- [x] Athlete can submit valid code → pending state
- [x] Invalid code shows error message
- [x] Pending shows wait + cancel works
- [x] Active shows coach (after coach accepts in Phase 5)
