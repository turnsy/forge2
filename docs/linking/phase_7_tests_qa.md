# Phase 7 — Tests & QA

**Status:** ⏳ Pending

**Goal:** Unit coverage for domain layer; manual test plan in PR for coach + athlete actors.

**Depends on:** Phases 1–6

---

## Agent actions

- [ ] `lib/links/repository.test.ts` complete
- [ ] `lib/links/errors.test.ts` if non-trivial
- [ ] Component tests only where behavior warrants (modal copy optional)
- [ ] Update all `phase_*.md` status to Done
- [ ] PR description includes manual test plan (two actors)

---

## Manual test plan (coach + athlete)

1. **Coach invite modal** — Sign in as coach → Athletes → Add → modal shows code → Copy works
2. **Athlete request** — Sign in as athlete → enter coach code → pending state with coach name + Cancel
3. **Coach pending pill** — Coach sees red Pending (1) → opens pending page
4. **Accept** — Coach accepts → athlete sees coach centered; coach sees athlete on main list
5. **Athlete unlink** — Athlete unlinks → back to code input; removed from coach list
6. **Re-request** — Athlete submits same code again → pending → coach accepts
7. **Reject** — Coach rejects pending → athlete unlinked state; can re-request
8. **Cancel** — Athlete cancels pending → unlinked state
9. **Coach unlink** — Active athlete → coach detail → unlink → athlete unlinked
10. **Invalid code** — Athlete enters garbage → error, no row created
11. **Already linked** — Active athlete has no code input field

---

## Done criteria

- [ ] `pnpm test` passes
- [ ] All phase docs marked Done
- [ ] PR open with manual test plan
