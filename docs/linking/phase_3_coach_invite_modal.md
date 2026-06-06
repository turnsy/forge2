# Phase 3 — Coach invite modal

**Status:** ⏳ Pending

**Goal:** Coach clicks **Add** on athletes list → modal shows invite code with copy button.

**Depends on:** Phase 2 (`getCoachInviteCode` or profile read)

**Blocks:** None (can ship independently of athlete flow)

---

## Agent actions

- [ ] `InviteCodeModal` client component (open/close, copy to clipboard, feedback)
- [ ] Wire `AthletesPageHeader` — pass coach `invite_code` from server page
- [ ] Functional-only styling per product direction

---

## Done criteria

- [ ] Coach can open modal from Add, see code, copy to clipboard
- [ ] Modal closes on dismiss / overlay click
