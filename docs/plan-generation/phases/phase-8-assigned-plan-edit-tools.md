# Phase 8 — Agent tools to edit an athlete's in-progress (assigned) plan

**Goal:** Give the coach agent a safe way to edit a plan an athlete is
already executing, reusing the exact same `forge_plan` Python builder and
Sandbox mechanism already built for the draft/template path — not a parallel
implementation.

**Depends on:** Phase 4 (Sandbox + `forge_plan` builder), existing
`isSetEditable`/`isDayEditable` client gating, `assigned_plans` table.

**Blocks:** Nothing for v1 plan-chat (draft creation). This is additive.

This phase is currently **design-only** — no tools exist yet. See
[status](#status) before starting implementation.

---

## 1. Problem statement

"The plan" is not one artifact. Today there are two distinct plan JSON
documents, and the coach agent can only edit one of them:

| Artifact | Table | Mutable via chat agent today? |
| --- | --- | --- |
| **Draft / template** — in-memory preview or a saved `plans` template, pre-assignment | `plans` + `plan_versions` | **Yes** — `submit_plan_code` (Python/Sandbox), gated by `loadWorkoutPlan()` |
| **Assigned / in-progress** — an athlete's live copy, cloned at assignment time and progressively filled in with `actual`/`status` as they train | `assigned_plans.plan_data` | **No agent tool exists.** Only a manual UI flow: `CoachAssignedPlanPanel` → `useSaveAssignedPlan` → `saveAssignedPlanAction` → `savePlanActuals` (`forge-next/lib/coach/assigned-plan/actions.ts`, `forge-next/lib/athlete/plan/repository.ts:126`) |

A coach saying *"swap the deadlift for RDLs in week 3 for Sarah"* or *"she's
sick, push the rest of this week back a day"* is asking to edit the **second**
kind of artifact — the one with completed sets, logged actuals, and an athlete
actively relying on it. None of the existing agent tools reach it:

- `submit_plan_code`, `summarize_current_artifact`, `set_current_artifact`,
  `clear_current_artifact` all read/write `coachArtifact` (Eve server state,
  `forge-next/agent/lib/coach-artifact-state.ts`) — the **draft**, not
  `assigned_plans`.
- `set_current_artifact` explicitly loads from `plans`/`plan_versions`
  (`fetchCoachPlanForTool`), not `assigned_plans`.
- `get_athlete_plan_progress` **reads** `assigned_plans` via
  `fetchCoachAthleteActiveAssignment` but has no companion write tool.
- `assign_plan` only creates a fresh `assigned_plans` row; per
  `assign_plan_to_athletes` (`supabase/migrations/20260607120000_plan_assignment_and_delete.sql:66-76`),
  if the athlete already has an **active assignment of the same `plan_id`**,
  the call is a silent no-op. **There is currently no path — agent or
  manual UI — that pushes an edited coach template into an athlete's existing
  in-progress copy of the same plan.** Reassignment only helps when switching
  to a different plan.

So this phase has two parts that must both be true for "edit an in-progress
plan" to mean anything useful:

1. **A new agent tool** that mutates `assigned_plans.plan_data` directly,
   scoped to one athlete, respecting what's already been logged.
2. **A defined answer** to "what happens to edits made to the coach's
   template while an athlete is mid-plan on it" (propagation, not just
   direct assigned-plan edits — see [§6](#6-template-vs-assigned-edits-and-propagation)).

## 2. Existing building blocks (reuse everything, build nothing new where possible)

| Concern | Already exists at | Reused as-is? |
| --- | --- | --- |
| Plan object model + full CRUD ref API (add/remove/move/update at week/day/block/exercise/set) | `forge-next/sandbox/forge_plan/plan.py` (`WeekRef`/`DayRef`/`BlockRef`/`ExerciseRef`/`SetRef`) | **Yes, unchanged.** This is the whole point of this design — see [§3](#3-design-reuse-the-python-builder--sandbox). |
| Model-facing API docs for that model | `forge-next/lib/plans/prompts/forge_plan_api_cheat_sheet.generated.ts` | Yes, unchanged. |
| Codegen skill (loaded before any `submit_*` tool) | `forge-next/agent/skills/plan-codegen.ts` | Yes, unchanged. |
| Sandbox definition + Python `forge_plan` copy | `forge-next/agent/sandbox/sandbox.ts`, `forge-next/agent/sandbox/workspace/forge_plan/` | Yes, unchanged. |
| Sandbox run/validate sequence (write seed + script, exec, read output, `loadWorkoutPlan`) | `forge-next/agent/tools/submit_plan_code.ts` | Yes, as a template to generalize/extract — see [§4](#4-proposed-tool-submit_athlete_plan_code). |
| Load one athlete's active assignment (with coach/athlete link check) | `forge-next/agent/lib/assigned-plans.ts` (`fetchCoachAthleteActiveAssignment`) | Yes, unchanged. |
| Editability rule (only `status: "planned"` sets/exercises/days are editable) | `forge-next/lib/plans/plan-editability.ts` | Yes, but needs a new diff-mode helper — see [§3b](#3b-whats-actually-new-seedsink-swap--an-editability-diff-guard). |
| Full-plan validation | `forge-next/lib/plans/validate.ts` (`loadWorkoutPlan`) | Yes, unchanged — same Ajv gate the draft path already uses. |
| Full-plan persist for assigned copies | `forge-next/lib/athlete/plan/repository.ts` (`savePlanActuals`) | Yes, but needs the editability guard wired in — see [§3b](#3b-whats-actually-new-seedsink-swap--an-editability-diff-guard). |

## 3. Design: reuse the Python builder + Sandbox

### 3a. Why reuse `forge_plan` instead of building a parallel TS domain layer

An earlier draft of this doc proposed a standalone TypeScript CRUD layer
(`addExerciseToDay`, `removeSetFromExercise`, etc.) plus four typed agent
tools. That's the wrong call: `forge_plan`'s refs already implement the exact
same operations, against the exact same schema, already exercised by
`submit_plan_code` in production. Duplicating that in TS would mean:

- Two implementations of "what does add/remove/move/update mean at each
  level" to keep in sync every time `workout-plan.schema.json` changes (on
  top of the Python/TS-constant sync `phase-7-schema-and-packaging.md`
  already flags as a risk with *one* copy).
- Two different mental models for the agent depending on which artifact it's
  editing, for what is conceptually the same verb set.
- Contradicts the repo rule to reuse domain logic and avoid duplicated
  implementations.

The trade-offs a TS-native path would have bought — no Sandbox spin-up
latency and lower token cost on trivial one-field edits, plus easier
per-operation approval gating — are trade-offs **already accepted** for the
draft path today (`submit_plan_code` pays the same Sandbox round trip for a
one-line edit to an in-progress draft). There's no principled reason
assigned-plan edits need a different cost/consistency trade-off than draft
edits when it's the same object shape. If Sandbox latency turns out to be a
real complaint specifically for assigned-plan edits in QA, that's a reason to
revisit — see [§8.1](#8-open-questions) — but it shouldn't be the starting
design.

### 3b. What's actually new: seed/sink swap + an editability diff guard

`submit_plan_code` today: seed = `coachArtifact.plan`, sink =
`setCoachArtifact`. The new tool only changes where the plan comes from and
where it goes:

```typescript
// submit_athlete_plan_code({ athleteId, python }, ctx)
const coachId = getCoachId(ctx);
const assignment = await fetchCoachAthleteActiveAssignment(coachId, athleteId); // existing helper
const before = assignment.plan;

// ...same sandbox write/exec/read/loadWorkoutPlan sequence as submit_plan_code,
// seeded with `before` instead of coachArtifact.plan...

const editabilityErrors = assertEditableChange(before, validated.plan); // new
if (editabilityErrors.length > 0) {
  return { ok: false, errors: editabilityErrors }; // same shape as a validation failure — model retries in-turn
}

await savePlanActuals(assignment.id, validated.plan); // existing helper, instead of setCoachArtifact
```

The only genuinely new pieces:

1. **`assertEditableChange(before, after): WorkoutPlanValidationError[]`** in
   `lib/plans/plan-editability.ts` — diffs `before`/`after` and flags any
   changed set/day/exercise that was not `isSetEditable`/`isDayEditable` in
   `before`. This is necessary regardless of whether the mutation came from
   Python or hand-written TS: `SetRef.update()` in `plan.py` has no concept
   of `status`/`locked` and will happily overwrite a completed set's
   `planned` fields if the script touches it. The guard has to live outside
   the builder, in the TS layer that already owns this rule for the manual
   UI path.
2. **Wire that guard into `savePlanActuals` itself**, not just the new tool.
   Today `savePlanActuals` validates schema shape and `assignment.status ===
   "active"` but does not re-check per-set/day editability — that's
   currently enforced only by disabling inputs in `PlanEditableDay`/
   `CoachEditableDayView`. A hand-crafted request to the existing manual-edit
   server action could already overwrite a completed set. Fixing this in
   `savePlanActuals` closes that gap for both the manual UI and the new
   agent tool in one place.
3. **The seed/sink swap itself** — cleanest as a small refactor: extract the
   "write seed + script, exec, read output, validate" sequence out of
   `submit_plan_code.ts` into a shared helper (e.g.
   `agent/lib/run-plan-code.ts`) that both tools call with a `{ seed, onSuccess
   }` argument, so the two tools differ only in seed source and persistence
   call, not in duplicated Sandbox plumbing.

No changes needed to: `forge_plan` (Python), the cheat sheet, the
`plan-codegen` skill, or `workout-plan.schema.json`.

### 3c. Concurrency

There's no `updated_at`/version column on `assigned_plans` today, so an agent
edit has a race window against the athlete's own logging (mobile app)
between reading `assignment.plan` and writing the result. Two options,
increasing cost:

1. **Cheap v1:** re-fetch the assignment row and re-run
   `assertEditableChange` against the freshly-fetched row immediately before
   the `savePlanActuals` write (shrinks the window to one extra query, no
   schema change).
2. **Robust:** add `updated_at timestamptz` (+ trigger) to `assigned_plans`
   and require the write to include a `WHERE updated_at = :expected`
   optimistic-lock clause, surfacing a `CONFLICT` tool error to retry.

Start with (1); only build (2) if QA finds real races. This mirrors
`submit_plan_code`'s own posture today (no locking on `coachArtifact`
either).

## 4. Proposed tool: `submit_athlete_plan_code`

```typescript
inputSchema: z.object({
  athleteId: z.string().uuid().describe("Athlete profile id."),
  python: z.string().min(1).describe(
    "Complete run.py body: use Plan.load(), edit via week()/day()/block()/exercise()/set() refs, then plan.save(). " +
    "Only touch sets/days that are not yet completed — edits to logged work are rejected.",
  ),
}),
```

Behavior, mirroring `submit_plan_code`'s existing retry/error UX exactly:

1. Resolve the active assignment via `fetchCoachAthleteActiveAssignment` (404
   → tool error, same shape as `get_athlete_plan_progress`'s not-found case).
2. Run the shared Sandbox sequence seeded with `assignment.plan` (see
   [§3b](#3b-whats-actually-new-seedsink-swap--an-editability-diff-guard)).
3. On sandbox/validation failure: return `{ ok: false, errors }` — same as
   today; the model fixes and resubmits within the same per-turn retry
   budget (reuse or extend `reserveSubmitPlanCodeAttempt`'s pattern, scoped
   per tool+turn).
4. On success but an editability violation: return `{ ok: false, errors:
   [{ path, message: "This set is already completed and cannot be edited." }] }`
   — model retries by regenerating the script without touching that path.
5. On full success: `savePlanActuals(assignment.id, validated.plan)`, return
   `{ ok: true, summary: "Updated Sarah's plan." }` — never full plan JSON,
   same `toModelOutput` discipline as `submit_plan_code`.

**`skill: plan-codegen`** should load before this tool too (same builder,
same schema) — add it to the "Always load before" list in
`agent/instructions.md` alongside `submit_plan_code`, with a short note that
edits to an athlete's in-progress plan should avoid already-completed
work (the guard enforces it either way; the note just reduces wasted
attempts).

### Read tool

`get_athlete_plan_progress` already exists and already returns per-set
status/actuals when `week`/`day` are given — reuse it unchanged as the way
the model finds out what it can safely touch before calling
`submit_athlete_plan_code`. No new read tool is needed to start; the hard
editability guard means the model doesn't need perfect foreknowledge, just a
way to recover from a rejection.

**Deliberately excluded from what the agent can change:** `status` and
`actual` on any set. Those are the athlete's logged truth — even though
`forge_plan`'s builder technically lets a script set them, the editability
guard should reject any diff that changes `status`/`actual` on a set that
already had `status !== "planned"`, and a coach agent silently marking a set
"completed" would defeat the purpose of tracking real progress. If a future
need arises (e.g. "mark today's session as skipped since she's traveling"),
model it as an explicit, separately-approved tool, not a side effect of a
generic Python submission.

## 5. Approval / safety posture

`assign_plan` uses `approval: always()` (`eve/tools/approval`) because it's a
one-way, athlete-visible action. Recommend the same for
`submit_athlete_plan_code`: unlike the four narrow, typed tools from the
earlier draft of this doc, a Python-string tool can do anything the builder
allows in one call, and there's no way to gate specific operations (e.g.
"only removals need approval") without parsing the script — so gate the
whole tool conservatively at first. Revisit (relax to no-approval, matching
`submit_plan_code`) if QA shows coaches find blanket approval on every small
assigned-plan edit annoying relative to the actual risk.

## 6. Template vs. assigned edits, and propagation

`submit_athlete_plan_code` only ever touches one athlete's `assigned_plans`
row. It does not touch `plans`/`plan_versions`, and doesn't need to — that
keeps the blast radius contained to the athlete the coach is explicitly
talking about, and reuses the exact persistence path (`savePlanActuals`)
already proven for the manual UI.

**Explicitly out of scope for this phase, but worth recording now so nobody
"fixes" `assign_plan_to_athletes`'s no-op behavior by accident:**

- **Bulk propagation** ("push my template edit to everyone currently running
  it") is a distinct feature: it needs a merge strategy for athletes who've
  already diverged (logged actuals on days the template edit also touched),
  which is a real product decision, not just an engineering one. Track as a
  separate phase/backlog item if requested — do not fold into this phase's
  scope.
- **Reassignment-as-update** (allowing `assign_plan_to_athletes` to refresh
  an existing same-`plan_id` assignment's un-logged future weeks from the new
  active version) is a plausible follow-up but changes existing,
  already-shipped RPC semantics — needs its own migration + tests, not a
  drive-by change here.

## 7. Testing plan (required before merge — see `AGENTS.md`)

| Layer | Tests |
| --- | --- |
| `assertEditableChange` | Unit tests: allowed edits to planned sets, rejected edits to completed/skipped sets, rejected edits to locked sets, rejected `status`/`actual` changes on non-planned sets, allowed structural additions (new set/exercise/day never conflicts with existing editability) |
| `savePlanActuals` regression | Test proving a completed-set edit is now rejected server-side even without going through the new tool (closes the existing gap called out in [§3b](#3b-whats-actually-new-seedsink-swap--an-editability-diff-guard)) |
| Shared Sandbox-run helper (extracted from `submit_plan_code.ts`) | Test both callers (`submit_plan_code`, `submit_athlete_plan_code`) against the same fixture scripts to confirm no behavior drift from the extraction |
| `submit_athlete_plan_code` tool | Fake `ToolContext` tests (pattern from `agent/lib/submit-plan-code-attempts.test.ts`): athlete not found/not linked, sandbox failure passthrough, editability-violation rejection surfaced as a tool error (not a thrown exception), successful edit persists and returns the expected compact shape, `toModelOutput` never contains full plan JSON |
| Retry/attempt limit | Same pattern as `submit-plan-code-attempts.test.ts`, scoped to the new tool |

## 8. Open questions

1. **Does Sandbox latency actually matter here in practice?** If QA/usage
   shows coaches making many tiny single-field edits to assigned plans and
   finding the round trip slow, that's the trigger to reconsider a narrow
   TS-native fast path for the single most common case (e.g. just "update one
   set's target/reps") without throwing away the Python path for everything
   else. Don't build it speculatively.
2. **Approval granularity.** Blanket `approval: always()` on the whole tool
   ([§5](#5-approval--safety-posture)) vs. inspecting the sandbox's
   before/after diff post-execution and only surfacing approval for
   destructive changes (removals). The latter needs Eve's approval model to
   support post-hoc/conditional approval, which may not exist — check before
   committing to it.
3. **Should "not editable" ever be an overridable warning instead of a hard
   rejection?** Coaches may legitimately want to fix a mis-logged set after
   the fact. Current recommendation is a hard rejection (matches the
   existing `isSetEditable` semantics used by the UI), treating "fix a wrong
   log" as a different, athlete-consented operation — not a silent coach
   override via chat.
4. **Undo.** `plan_versions` gives draft plans free rollback. `assigned_plans`
   has no equivalent. Worth a lightweight edit log (or reusing
   `plan_versions` with a nullable `assignment_id`) alongside this phase, or
   defer until a coach actually asks for "undo my last change to Sarah's
   plan"?
5. **Multi-edit turns.** "Swap deadlift for RDLs and bump the weight" is one
   `submit_athlete_plan_code` call with a script that does both — no
   different from how `submit_plan_code` already handles multi-part draft
   edits in one script. No new design needed here, just confirming the
   retry-budget constant covers this tool too.

## 9. Does the client need to know?

Unlike `coachArtifact` (which the reducer projects into `PlanViewer` live
during a chat turn), `assigned_plans` edits target a screen
(`CoachAthleteDetailView`) that is **not** the active chat surface for v1 —
the coach is chatting from `CoachWorkspace`, but the edit lands on a
different page. Recommend the tool's confirmation text be sufficient
(*"Updated Sarah's bench press for Thursday."*) and let the coach navigate to
the athlete's page to see it, rather than building cross-page live sync in
this phase. Revisit if/when assigned-plan editing gets its own chat surface
under `app/coach/**`.

## Status

- [ ] `assertEditableChange` guard in `lib/plans/plan-editability.ts`
- [ ] Wire the guard into `savePlanActuals` (regression fix, independent of the rest of this phase)
- [ ] Extract shared Sandbox-run helper from `submit_plan_code.ts`
- [ ] `submit_athlete_plan_code` tool (seed from `assignment.plan`, sink via `savePlanActuals`)
- [ ] `forge-tool-outputs.ts` — output type + guards for the new tool
- [ ] `agent/instructions.md` — add `submit_athlete_plan_code` to the plan-codegen skill's "load before" list; note on avoiding completed work
- [ ] Concurrency mitigation (start with re-validate-on-write, §3c)
- [ ] Tests (§7)
- [ ] Manual QA: edit a real in-progress assignment, confirm the athlete app reflects it, confirm completed sets are untouched

## Out of scope (this phase)

- Bulk template → all-assignments propagation ([§6](#6-template-vs-assigned-edits-and-propagation))
- Reassignment-as-refresh semantics for `assign_plan_to_athletes`
- Marking sets completed/skipped via agent (`status`/`actual` fields)
- Cross-page live sync of assigned-plan edits into an open chat session
- Undo/version history for assigned-plan edits (open question, §8.4)
- A TS-native fast path for common single-field edits (open question, §8.1) — considered and deferred, not rejected outright
