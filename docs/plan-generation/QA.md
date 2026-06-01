# Plan generation v1 — manual QA checklist

Use after Phase 6 integration. Requires local `.env.local` with Vercel AI Gateway + Sandbox credentials.

## Setup

- [ ] Coach user logged in
- [ ] Open `/coach/plans/create` (or final route from Phase 5)
- [ ] DevTools network tab open on plan-chat request

## Prompt-only

- [ ] “Build a 4-week strength plan, 4 days per week” → preview populates
- [ ] “Add a deload week as week 5” → preview updates, prior structure preserved where expected
- [ ] Invalid generation (if triggered) → error shown, preview unchanged

## CSV

- [ ] Attach Google Sheets CSV export → plan reflects table content reasonably

## PDF

- [ ] Attach small program PDF → plan reflects extracted content

## XLSX

- [ ] Single-sheet workbook → works without extra prompt
- [ ] Multi-sheet workbook, no sheet in prompt → assistant asks which sheet
- [ ] Reply with sheet name → succeeds

## Limits

- [ ] 6 files rejected with clear message
- [ ] Oversize PDF rejected

## Run lifecycle

- [ ] UI shows parsing → generating → sandbox → validating → done (or error)

## Auth & scope

- [ ] Logged-out request fails
- [ ] No new rows in `plans` / `plan_versions` after session (DB check optional)

## Refresh

- [ ] Page refresh clears in-memory draft (expected v1)
