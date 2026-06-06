# Phase 6 — Integration & QA

**Status:** Done

## Goal

End-to-end verification; `docs/plan-persistence/` docs complete; all phases shipped.

## Checklist

- [x] All phase 1–5 done criteria checked
- [x] `pnpm test:forge-plan` green
- [x] `pnpm build` green
- [x] Phase docs in `docs/plan-persistence/` updated to **Done**
- [x] Manual test plan in PR description

## Manual test plan (summary)

1. **Create & save** — `/coach` → prompt → preview → Save → lands on detail
2. **New button** — `/coach/plans` → New → `/coach`
3. **Edit** — detail → Edit → split pane with plan, empty chat
4. **Edit save** — iterate via chat → Save → stays on edit page
5. **Unsaved back** — change artifact → Back link → confirm dialog
6. **Version history** — detail shows versions after multiple saves
7. **Auth** — athlete cannot hit coach plan APIs (403)
