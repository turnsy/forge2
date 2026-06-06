# Phase 4 — Athlete link flow

**Status:** ⏳ Pending

**Goal:** Athlete `/athlete` page handles three states: unlinked (code input), pending (wait + cancel), active (coach + unlink).

**Depends on:** Phase 2

**Blocks:** Phase 6 (unlink athlete side partially here)

---

## Agent actions

- [ ] Server page loads `getAthleteCoachLink()`
- [ ] `AthleteLinkForm` — invite code input → `requestCoachLink` action
- [ ] `AthletePendingLink` — coach name, cancel button
- [ ] `AthleteActiveLink` — centered coach name + unlink (Phase 6 may refine unlink wiring)
- [ ] No code input when status is `active` or `pending`

---

## Done criteria

- [ ] Athlete can submit valid code → pending state
- [ ] Invalid code shows error message
- [ ] Pending shows wait + cancel works
- [ ] Active shows coach (after coach accepts in Phase 5)
