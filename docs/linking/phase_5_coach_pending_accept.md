# Phase 5 — Coach pending invites

**Status:** ⏳ Pending

**Goal:** Red **Pending (N)** pill on athletes list; separate `/coach/athletes/pending` page with accept/reject per row.

**Depends on:** Phases 1–2

**Blocks:** End-to-end link flow

---

## Agent actions

- [ ] `PendingInvitesPill` on `/coach/athletes` — red CTA, links to pending page
- [ ] `/coach/athletes/pending/page.tsx` — list pending athletes
- [ ] Accept / reject buttons per row (server actions)
- [ ] Coach athlete detail page stub upgrade for active athletes (minimal info)

---

## Done criteria

- [ ] Pill shows correct count; links to pending page
- [ ] Coach can accept → athlete sees active coach
- [ ] Coach can reject → athlete returns to unlinked (can re-request)
