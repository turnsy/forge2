# Phase 3 — Coach invite modal

**Status:** ✅ Done

**Goal:** Coach clicks **Add** on athletes list → modal shows invite code with copy button.

**Depends on:** Phase 2 (`getCoachInviteCode` or profile read)

**Blocks:** None (can ship independently of athlete flow)

---

## Agent actions

- [x] `InviteCodeModal` client component (open/close, copy to clipboard, feedback)
- [x] Wire `AthletesPageHeader` — pass coach `invite_code` from server page
- [x] Functional-only styling per product direction

---

## Done criteria

- [x] Coach can open modal from Add, see code, copy to clipboard
- [x] Modal closes on dismiss / overlay click
