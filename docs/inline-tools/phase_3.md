# Phase 3 — Mutating tools

**Status:** Not started

**Goal:** Allow the agent to accept/reject pending coach links and assign/reassign plans to athletes. No delete operations.

**Depends on:** [phase_2.md](./phase_2.md)

**Blocks:** Phase 4 (assignment may precede artifact editing)

---

## Scope

### Tool definitions

- [ ] `accept_coach_link` — input: `relationshipId`; wraps `acceptCoachLink`
- [ ] `reject_coach_link` — input: `relationshipId`; wraps `rejectCoachLink`
- [ ] `assign_plan` — input: `planId`, `athleteIds: string[]`; wraps `assignPlanToAthletes`
  - Replaces active assignment for each athlete (existing RPC semantics)
  - Returns: `{ assigned: { athleteId, assignmentId }[] }` or structured errors

### Safety (no confirmation UI yet)

- [ ] Tool descriptions state these are real mutations — agent should confirm intent in chat before calling when ambiguous
- [ ] **No** `delete_coach_plan`, `unlink_coach_athlete`, or other destructive ops
- [ ] Validate `athleteIds` are actively linked before assign (RPC already enforces)

### Error handling

- [ ] Map RPC errors to tool-friendly messages (`Athlete not linked to coach`, `Plan not found`, etc.)
- [ ] Partial failure behavior documented (assign is atomic per RPC — all or nothing)

### Tests

- [ ] Unit tests with mocked `links/repository` and `plans/mutations`
- [ ] Happy path: accept link, reject link, assign plan
- [ ] Error paths: invalid relationshipId, unlinked athlete, foreign planId

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/coach-agent/tools/mutate-tools.ts` | New |
| `forge-next/lib/ai/coach-agent/tools/create-coach-agent-tools.ts` | Extend |
| `forge-next/lib/ai/plan-chat/orchestrator.ts` | Register mutate tools |
| `forge-next/lib/ai/coach-agent/tools/mutate-tools.test.ts` | New |

---

## Done criteria

- [ ] Three mutate tools registered and tested
- [ ] No delete/unlink tools exposed
- [ ] Assign uses existing `assign_plan_to_athletes` RPC
- [ ] Link accept/reject uses existing link RPCs

### Future (out of scope)

- [ ] Confirmation modal before destructive or high-impact mutations
- [ ] `unlink_coach_athlete` tool
