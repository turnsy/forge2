# Phase 6 — Integration & QA

**Status:** Pending

## Goal

End-to-end verification; docs updated; all phases complete.

## Checklist

- [ ] All phase 1–5 done criteria checked
- [ ] `pnpm test:forge-plan` green
- [ ] `pnpm build` green
- [ ] Phase docs status updated to **Done**
- [ ] Manual test plan in PR description

## Manual test plan (summary)

1. **Create & save** — `/coach` → prompt → preview → Save → lands on detail
2. **New button** — `/coach/plans` → New → `/coach`
3. **Edit** — detail → Edit → split pane with plan, empty chat
4. **Edit save** — iterate via chat → Save → stays on edit page
5. **Unsaved back** — change artifact → Back link → confirm dialog
6. **Version history** — detail shows versions after multiple saves
7. **Auth** — athlete cannot hit coach plan APIs (403)
