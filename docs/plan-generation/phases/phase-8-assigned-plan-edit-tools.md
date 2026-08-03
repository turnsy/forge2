# Phase 8 — Agent tools to edit an athlete's in-progress (assigned) plan

**Goal:** Let the coach agent edit a plan an athlete is already executing,
by reusing the same `forge_plan` Python builder and Sandbox mechanism
`submit_plan_code` already uses — not a parallel implementation.

**Status:** Design only, not started. See [checklist](#checklist).

---

## Problem

There are two distinct plan artifacts, and the agent can only edit one:

| Artifact | Table | Editable via chat agent today? |
| --- | --- | --- |
| Draft / template | `plans` + `plan_versions` | Yes — `submit_plan_code` |
| Assigned / in-progress (athlete's live copy, filled in with logged `actual`/`status` as they train) | `assigned_plans.plan_data` | **No.** Only a manual UI flow (`CoachAthleteDetailView` → `savePlanActuals`) |

"Swap the deadlift for RDLs in week 3 for Sarah" targets the second artifact —
one with completed sets and real logged history — which no existing tool
reaches (`coachArtifact`-based tools all target the draft; `assign_plan` only
creates new assignments and no-ops if the athlete already has this plan
active, so there's also no propagation path from an edited template into an
in-progress copy — see [scope](#scope)).

## Design: generalize `submit_plan_code`, don't rebuild it

`forge_plan` (the Python builder) already implements add/remove/move/update
at every level (`WeekRef`/`DayRef`/`BlockRef`/`ExerciseRef`/`SetRef`) against
the same schema `submit_plan_code` already uses in production. A parallel
TypeScript CRUD layer would duplicate that logic, create a second codepath to
keep in sync with schema changes, and buy nothing — the reasons to avoid it
(Sandbox latency/cost, coarse approval) are trade-offs already accepted for
draft edits today. So: one new tool, `submit_athlete_plan_code`, same
Sandbox/builder/skill/cheat sheet, unchanged. It differs from
`submit_plan_code` in exactly three ways:

1. **Seed** the sandbox from `assignment.plan_data` (via the existing
   `fetchCoachAthleteActiveAssignment`) instead of `coachArtifact`.
2. **Persist** via the existing `savePlanActuals` instead of
   `setCoachArtifact`.
3. **Guard editability**: after sandbox validation, diff before/after with a
   new `assertEditableChange(before, after)` (in `lib/plans/plan-editability.ts`)
   and reject (same `{ ok: false, errors }` shape the model already retries
   against) any change touching a set/day/exercise that wasn't
   `isSetEditable`/`isDayEditable`, or that touches `status`/`actual`
   (the athlete's logged truth — never agent-writable). This is required
   because `forge_plan`'s `SetRef.update()` has no concept of `status`/
   `locked` and will happily overwrite completed work if a script touches it.

Extract the shared "write seed + script, exec, read output, validate"
sequence out of `submit_plan_code.ts` so both tools call one helper and only
differ in seed source / persistence call.

**Existing gap this also fixes:** `savePlanActuals` (behind the manual UI
edit flow) doesn't currently re-check per-set/day editability server-side —
only the UI disables inputs. Wire `assertEditableChange` into `savePlanActuals`
directly so both the manual path and the new tool are covered.

**Concurrency:** no `updated_at`/version column on `assigned_plans` today, so
there's a race window against the athlete's own logging. Start cheap:
re-fetch the assignment and re-run the editability check immediately before
the write. Only add optimistic locking if QA finds real races.

## Approval

Gate `submit_athlete_plan_code` with `approval: always()` (same as
`assign_plan`) — a Python-string tool can't be gated per-operation, so it's
all-or-nothing. Relax later if blanket approval proves annoying relative to
actual risk.

## Scope

- Touches one athlete's `assigned_plans` row only — never
  `plans`/`plan_versions`.
- **Out of scope:** bulk template→assignments propagation (needs a merge
  strategy for athletes who've already diverged — a product decision, not an
  engineering one), reassignment-as-refresh semantics for
  `assign_plan_to_athletes`, marking sets completed/skipped via agent, and
  undo/version history for assigned-plan edits. Cross-page live sync isn't
  needed either — a short chat confirmation ("Updated Sarah's bench press for
  Thursday") is enough; the coach checks the athlete's page to see it.

## Open questions

- Does Sandbox latency actually bother coaches for small assigned-plan edits
  enough to justify a narrow TS fast path later? Don't build it speculatively.
- Should "not editable" ever be an overridable warning instead of a hard
  rejection (e.g. coach fixing a mis-logged set)? Leaning hard rejection —
  treat that as a separate, athlete-consented flow.

## Testing (required before merge — see `AGENTS.md`)

- `assertEditableChange`: allowed edits to planned sets; rejected edits to
  completed/skipped/locked sets; rejected `status`/`actual` changes; allowed
  structural additions.
- `savePlanActuals` regression: completed-set edit now rejected server-side.
- Shared Sandbox-run helper: both callers behave identically post-extraction.
- `submit_athlete_plan_code`: not-found/not-linked athlete, sandbox failure
  passthrough, editability rejection, successful edit persists, no full plan
  JSON in `toModelOutput`.
- Retry/attempt limit, same pattern as `submit-plan-code-attempts.test.ts`.

## Checklist

- [ ] `assertEditableChange` guard in `lib/plans/plan-editability.ts`
- [ ] Wire the guard into `savePlanActuals` (independent regression fix)
- [ ] Extract shared Sandbox-run helper from `submit_plan_code.ts`
- [ ] `submit_athlete_plan_code` tool
- [ ] `forge-tool-outputs.ts` output type + guards
- [ ] `agent/instructions.md` — add to plan-codegen skill's "load before" list
- [ ] Concurrency mitigation (re-validate-on-write)
- [ ] Tests
- [ ] Manual QA: real in-progress assignment, athlete app reflects the edit, completed sets untouched
