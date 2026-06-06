# Phase 5 — Coach pending invites

**Status:** ✅ Done

**Goal:** Red **Pending (N)** pill on athletes list; separate `/coach/athletes/pending` page with accept/reject per row.

**Depends on:** Phases 1–2

**Blocks:** End-to-end link flow

---

## Agent actions

- [x] `PendingInvitesPill` on `/coach/athletes` — red CTA, links to pending page
- [x] `/coach/athletes/pending/page.tsx` — list pending athletes
- [x] Accept / reject buttons per row (server actions)
- [x] Coach athlete detail page loads active athlete info

---

## Done criteria

- [x] Pill shows correct count; links to pending page
- [x] Coach can accept → athlete sees active coach
- [x] Coach can reject → athlete returns to unlinked (can re-request)
