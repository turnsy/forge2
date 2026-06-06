# Phase 3 — Edit route + workspace hydration

**Status:** Done

## Goal

Edit existing plans at `/coach/plans/[planId]/edit` with the same split-pane experience as creation.

## Scope

### Route

- `app/coach/(app)/plans/[planId]/edit/page.tsx` — load plan, render hydrated workspace

### Workspace

- `useChatWorkspace` accepts optional `initialState`
- `CoachWorkspace` props: `mode`, `planId`, `initialPlan`, `backHref`
- Edit mode: `hasStarted: true`, artifact pre-loaded, empty chat
- Save calls version endpoint; **stays in workspace** after save
- Back link to `/coach/plans/[planId]` with unsaved-changes confirm

### Detail page

- Edit button → `ButtonLink` to edit route

### Unsaved detection

- Track `savedSnapshot` (plan JSON + title) after hydrate and each successful save
- Back link: `confirm()` if current artifact/title differs

## Files

| File | Action |
| --- | --- |
| `forge-next/app/coach/(app)/plans/[planId]/edit/page.tsx` | New |
| `forge-next/lib/chat/use-chat-workspace.ts` | Extend |
| `forge-next/lib/plans/plan-snapshot.ts` | New |
| `forge-next/components/coach/coach-workspace.tsx` | Edit mode |
| `forge-next/app/coach/(app)/plans/[planId]/page.tsx` | Edit link |

## Done criteria

- [x] Edit route loads plan into workspace
- [x] Save appends version without leaving workspace
- [x] Back link warns on unsaved changes only
- [x] Detail Edit button navigates to edit route
