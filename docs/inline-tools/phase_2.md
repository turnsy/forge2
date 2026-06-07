# Phase 2 — Read tools

**Status:** Not started

**Goal:** Expose coach-scoped list and read database operations as AI tools. Never return full plan JSON blobs.

**Depends on:** [phase_1.md](./phase_1.md)

**Blocks:** Phases 3–5 (mutations and mentions assume read tools exist)

---

## Scope

### Tool definitions

- [ ] `list_athletes` — wraps `listCoachAthletes`; supports optional search query
  - Returns: `{ id, name, currentPlanId, currentPlanName, joinedAt }[]` + pagination hint
- [ ] `get_athlete` — wraps `getCoachAthleteRelationship`
  - Returns: relationship status, athlete name, current assignment metadata (plan id/name/status)
  - **No** full `plan_data`
- [ ] `list_plans` — wraps `listCoachPlans`
  - Returns: `{ id, name, updatedAt, athleteCount? }[]` + pagination hint
- [ ] `get_plan` — wraps `getCoachPlanById` but **strips `plan_data`**
  - Returns: `{ id, name, activeVersionId, changeSummary, updatedAt, summary: summarizePlan(plan) }`
  - **Never** include raw `plan_data` JSON
- [ ] `list_plan_versions` — wraps `listCoachPlanVersions`
  - Returns: version metadata only (id, createdAt, changeSummary) — no `plan_data`
- [ ] `list_pending_invites` — wraps `listCoachPendingInvites`
  - Returns: `{ relationshipId, athleteName, requestedAt }[]`

### Shared helpers

- [ ] `lib/ai/coach-agent/tools/plan-summaries.ts` (or similar) — `toPlanToolSummary(plan)` using `summarizePlan()`
- [ ] `lib/ai/coach-agent/tools/db-tool-errors.ts` — map `ServiceError` / RPC failures to tool return shape
- [ ] All tools verify coach session via existing `requireApiRole` boundary (coachId from route context)

### Permissions

- [ ] Tools call existing repositories; RPCs enforce `auth.uid()` ownership
- [ ] `get_athlete` / `get_plan` return structured “not found” when ID invalid or not owned

### Tests

- [ ] Unit tests per tool with mocked repositories
- [ ] Assert `get_plan` response never contains `plan_data` or week/exercise arrays
- [ ] Assert `get_athlete` returns assignment metadata without workout content

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/coach-agent/tools/read-tools.ts` | New |
| `forge-next/lib/ai/coach-agent/tools/plan-summaries.ts` | New |
| `forge-next/lib/ai/coach-agent/tools/create-coach-agent-tools.ts` | New (factory composing all tools) |
| `forge-next/lib/ai/plan-chat/orchestrator.ts` | Register read tools |
| `forge-next/lib/ai/coach-agent/tools/read-tools.test.ts` | New |

---

## Done criteria

- [ ] All six read tools registered in orchestrator
- [ ] `get_plan` returns summary only — verified by test
- [ ] Tools handle not-found and permission errors gracefully
- [ ] No new Supabase migrations required (uses existing RPCs)
