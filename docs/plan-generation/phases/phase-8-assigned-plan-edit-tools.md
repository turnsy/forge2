# Phase 8 — Agent tools to edit an athlete's in-progress (assigned) plan

**Goal:** Give the coach agent a safe, granular way to edit a plan an athlete is
already executing — without a Python/Sandbox round trip, without clobbering
logged work, and without silently diverging from the draft-editing tools built
in Phases 1–6.

**Depends on:** Phase 4 (sandbox/codegen, for contrast), existing
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

1. **New agent tools** that mutate `assigned_plans.plan_data` directly,
   scoped to one athlete, respecting what's already been logged.
2. **A defined answer** to "what happens to edits made to the coach's
   template while an athlete is mid-plan on it" (propagation, not just
   direct assigned-plan edits — see [§6](#6-template-vs-assigned-edits-and-propagation)).

## 2. Existing building blocks (reuse, don't duplicate)

| Concern | Already exists at |
| --- | --- |
| Load one athlete's active assignment (with coach/athlete link check) | `forge-next/agent/lib/assigned-plans.ts` (`fetchCoachAthleteActiveAssignment`) |
| Editability rule (only `status: "planned"` sets/exercises/days are editable) | `forge-next/lib/plans/plan-editability.ts` |
| Full-plan validation | `forge-next/lib/plans/validate.ts` (`loadWorkoutPlan`, Ajv against `workout-plan.schema.json`) |
| Full-plan persist (already validates + `status === "active"` guard) | `forge-next/lib/athlete/plan/repository.ts` (`savePlanActuals`) via `saveAssignedPlanAction` |
| Compact plan/day text summary | `forge-next/lib/plans/summarize-plan.ts` |
| Structural mutation helpers (week/day only — **immutable, return a new plan**) | `forge-next/lib/plans/plan-structure.ts` |
| Exercise/set locate + update helpers (**exercise/set update only, no add/remove/move**) | `forge-next/lib/plans/day-blocks.ts` |
| Reference shape for the full CRUD surface we're missing in TS | `forge-next/sandbox/forge_plan/plan.py` (`WeekRef`/`DayRef`/`BlockRef`/`ExerciseRef`/`SetRef` — add/remove/move/update, all 0-based) |
| Agent tool scaffolding pattern | `forge-next/agent/lib/define-forge-tool.ts`, any file in `forge-next/agent/tools/*.ts` |

The Python ref API in `plan.py` is the best spec for the TS surface we need —
it already solved "what does add/remove/move/update mean at each level" for
the draft/codegen path. We should mirror its verbs, not invent new ones.

## 3. Gaps to close before writing tools

### 3a. TS domain layer: block/exercise/set CRUD

`day-blocks.ts` only has `updateFlattenedExercise` / `updateFlattenedSet`.
There is no TS equivalent of `ExerciseRef.remove/move/add_set`,
`BlockRef.remove/move`, or `SetRef.remove/move/update_target`. Extend
`day-blocks.ts` (or a new `forge-next/lib/plans/day-edit.ts` if it grows too
large) with pure, immutable functions mirroring the Python refs:

```typescript
addExerciseToDay(day, { blockPos?, name, notes?, videoUrl?, initialSets? }): Day
removeExerciseFromDay(day, flatExercisePos): Day
moveExerciseInDay(day, flatExercisePos, toIndex): Day
updateExerciseInDay(day, flatExercisePos, { name?, notes?, videoUrl? }): Day // exists, generalize updateFlattenedExercise
addSetToExercise(day, flatExercisePos, { reps, target, unit, count?, notes? }): Day
removeSetFromExercise(day, flatExercisePos, setPos): Day
moveSetInExercise(day, flatExercisePos, setPos, toIndex): Day
updateSetInExercise(day, flatExercisePos, setPos, { reps?, target?, unit?, notes?, status?, locked? }): Day
```

Keep the same invariants the Python refs enforce (exercise must keep ≥1 set,
block must keep ≥1 exercise, day must keep ≥1 block) and return `null`/throw a
typed error on invalid indices, matching `plan-structure.ts`'s `| null`
convention.

### 3b. Editability must be enforced server-side, not just in the UI

`savePlanActuals` (`forge-next/lib/athlete/plan/repository.ts:126`) validates
schema shape and assignment status, but **does not re-check per-set/day
editability** — that's currently only enforced by disabling inputs in
`PlanEditableDay`/`CoachEditableDayView`. A hand-crafted `fetch` to the server
action today could already overwrite a completed set's `actual`/`status`.
Agent tools make this worse because there's no UI in the loop at all.

Add a shared guard, e.g. `assertEditableChange(before: WorkoutPlan, after: WorkoutPlan): WorkoutPlanValidationError[]`
in `lib/plans/plan-editability.ts`, that diffs `before`/`after` and rejects any
change touching a set/day that was not `isSetEditable`/`isDayEditable` in
`before`. Call it from:

- `savePlanActuals` (closes the existing gap for the manual UI path too).
- Every new agent write tool, before persisting.

This is the single most important correctness fix in this phase — everything
else is ergonomics.

### 3c. `assigned_plans` needs a concurrency guard

There's no `updated_at`/version column on `assigned_plans` today. An agent
edit tool that reads-then-writes has a race window against the athlete's own
logging (mobile app) between those two steps. Two options, in increasing
cost:

1. **Cheap v1:** re-validate editability against the row fetched *inside the
   same tool call* right before the update (short window, no schema change).
2. **Robust:** add `updated_at timestamptz` (+ trigger) to `assigned_plans`
   and require the tool's write to include a `WHERE updated_at = :expected`
   optimistic-lock clause, surfacing a `CONFLICT` tool error to retry.

Recommend starting with (1) and only building (2) if QA finds real races
(coach and athlete editing at the same moment is rare in practice — same
mitigation posture as `submit_plan_code`, which has no locking either).

## 4. Proposed tools

All new tools live in `forge-next/agent/tools/`, follow the
`defineForgeTool` pattern, take `athleteId` (never a raw `assignmentId` —
resolve via `fetchCoachAthleteActiveAssignment` so coach/athlete-link
authorization is enforced the same way `get_athlete_plan_progress` already
does), use **0-based** week/day/exercise/set indices (same convention as
every existing plan tool — see `agent/instructions.md`), and **never** return
full plan JSON to the model (`toModelOutput` returns a short confirmation or a
typed error list, same as `submit_plan_code`).

### Read (must ship first — the model needs indices before it can edit)

| Tool | Input | Output (to model) |
| --- | --- | --- |
| `get_athlete_plan_progress` *(extend existing)* | `athleteId`, `week?`, `day?` | Already returns prose; no change needed for reads. |
| `describe_athlete_plan_day` *(new)* | `athleteId`, `week`, `day` | Structured (not prose) list of `{ flatExercisePos, blockPos, name, sets: [{ setPos, status, editable }] }` for that day only. Purpose: let the model resolve exact indices reliably before calling a write tool, instead of parsing prose from `get_athlete_plan_progress`. Small, scoped to one day — never the full plan. |

Whether `describe_athlete_plan_day` becomes its own tool or an `indices: true`
option on `get_athlete_plan_progress` is an implementation choice — see
[open questions](#7-open-questions).

### Write — one tool per entity level, `action` discriminates the operation

Consolidating into 4 tools (rather than ~16 single-purpose ones) keeps the
tool-choice surface small for the model while still being fully typed via Zod
discriminated unions per `action`. This mirrors how a coach actually talks
("change this set", "add a day") — one entity, one verb, occasionally a
target position.

```typescript
edit_athlete_plan_week({
  athleteId, week,
  action: "update" | "remove" | "move" | "add_after",
  // update: { label?, name?, notes? }
  // remove: {}
  // move: { toIndex }
  // add_after: { name?, notes? }  -- inserts a new empty week
})

edit_athlete_plan_day({
  athleteId, week, day,
  action: "update" | "remove" | "move" | "add_after",
  // update: { name?, notes? }
  // remove: {}
  // move: { toIndex }
  // add_after: { name?, notes? }
})

edit_athlete_plan_exercise({
  athleteId, week, day,
  exercisePos, // flat index within the day; omitted for "add"
  action: "update" | "remove" | "move" | "add",
  // update: { name?, notes?, videoUrl? }
  // remove: {}
  // move: { toIndex }
  // add: { name, notes?, videoUrl?, asSupersetWithBlockPos?, initialSets?: [{ reps, target, unit, count?, notes? }] }
})

edit_athlete_plan_set({
  athleteId, week, day, exercisePos,
  setPos, // omitted for "add"
  action: "update" | "remove" | "move" | "add",
  // update: { reps?, target?, unit?, notes?, locked? }  -- NOT status/actual; see below
  // remove: {}
  // move: { toIndex }
  // add: { reps, target, unit, count?, notes? }
})
```

Every tool:

1. Resolves the active assignment via `fetchCoachAthleteActiveAssignment(coachId, athleteId)` (404 if none/not linked, matching `get_athlete_plan_progress`).
2. Applies the pure TS transform from [§3a](#3a-ts-domain-layer-blockexerciseset-crud) / `plan-structure.ts` to a clone of `assignment.plan`.
3. Runs `assertEditableChange(before, after)` from [§3b](#3b-editability-must-be-enforced-server-side-not-just-in-the-ui) — rejects edits touching non-`planned` sets/days.
4. Runs `loadWorkoutPlan(after)` (schema validation).
5. Persists via `savePlanActuals(assignment.id, after)` (or a shared internal helper both this tool and `saveAssignedPlanAction` call, to avoid duplicating the validate+guard+update sequence).
6. Returns `{ ok: true, summary: string }` on success (e.g. `"Updated set."`) or `{ ok: false, code, message }`/`{ ok: false, errors }` on failure — same shape family as `SubmitPlanCodeOutput` / `SetCurrentArtifactOutput` in `forge-tool-outputs.ts`. Add `EditAthletePlanOutput` alongside them.

**Deliberately excluded from `update` on sets:** `status` and `actual`. Those
are the athlete's logged truth; a coach agent silently marking a set
"completed" would corrupt progress tracking and defeats the purpose of the
editability guard. If a future need arises (e.g. "mark today's session as
skipped since she's traveling"), model it as an explicit, separately-reviewed
tool (`skip_athlete_plan_day`), not a generic field on `update`.

### Why not one mega tool, and why not ~16 tiny tools

- **One tool with `entity` + `action` + a big optional-everything payload**
  is harder for the model to fill in correctly (ambiguous which fields apply)
  and harder to validate with Zod (a five-way discriminated union nested
  inside another discriminated union). Not recommended.
- **One tool per (entity × action)** (`add_week`, `remove_week`, `move_week`,
  `update_week`, `add_day`, … ~16-20 tools total) is the clearest per-call
  contract but adds meaningful system-prompt/tool-list token cost every turn
  and more surface for the model to pick the "almost right" tool. Consider
  this only if the 4-tool `action`-discriminated design proves ambiguous in
  practice (watch for: model calling `edit_athlete_plan_set` with
  `action: "update"` when it meant to remove a set, etc. — cheap to detect in
  eval transcripts).
- The 4-tool design is the recommended starting point; both alternatives are
  easy migrations later since the underlying domain functions
  ([§3a](#3a-ts-domain-layer-blockexerciseset-crud)) are the same either way.

## 5. Approval / safety posture

`assign_plan` uses `approval: always()` (`eve/tools/approval`) because it's a
one-way, athlete-visible action. Assigned-plan edits are similar in kind —
they change what an athlete sees next time they open the app — but are
usually low-stakes and reversible (a wrong load is not a wrong exercise
assignment). Recommendation: **no approval gate for individual field
updates** (`update`/`move`), but consider `approval: always()` for
`remove` on exercises/days/weeks (destructive, harder to reconstruct) and for
any future `skip_athlete_plan_day` tool. Revisit after QA if coaches report
surprise edits.

## 6. Template vs. assigned edits, and propagation

This phase's tools only ever touch one athlete's `assigned_plans` row. They
do not touch `plans`/`plan_versions`, and they do not need to — that keeps
the blast radius contained to the athlete the coach is explicitly talking
about, and reuses the exact persistence path (`savePlanActuals`) already
proven for the manual UI.

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

## 7. Open questions

1. **`describe_athlete_plan_day` as its own tool vs. an option on
   `get_athlete_plan_progress`.** Leaning toward extending the existing tool
   (one fewer tool in the list) with a `withIndices?: boolean` flag that adds
   an `exercises: [...]` structured array alongside the prose `summary`, if
   the output-type plumbing in `forge-tool-outputs.ts` allows a clean
   `toModelOutput` split. Needs a spike before locking the design.
2. **Should `edit_athlete_plan_*` tools require the day/week/exercise to
   currently be editable, or should "not editable" be a soft warning with an
   override flag?** Current recommendation is a hard rejection (fits the
   existing `isSetEditable` semantics used by the UI), but coaches may
   legitimately want to fix a mis-logged set after the fact — that's arguably
   a different, athlete-consented operation, not a silent coach override.
3. **Undo.** `plan_versions` gives draft plans free rollback. `assigned_plans`
   has no equivalent. Is a lightweight `assigned_plan_edit_log` (or reusing
   `plan_versions` with a nullable `assignment_id`) worth adding alongside
   this phase, or deferred until a coach actually asks for "undo my last
   change to Sarah's plan"?
4. **Multi-entity edits in one turn.** "Swap deadlift for RDLs and bump the
   weight" is `edit_athlete_plan_exercise` (update name) +
   `edit_athlete_plan_set` × N (update target) — multiple tool calls in one
   turn is fine (same pattern as `submit_plan_code` retries), but confirm the
   agent's per-turn tool-call budget is generous enough; there's no
   `MAX_..._ATTEMPTS_PER_TURN`-style cap needed here since each call is a
   fast, validated TS mutation, not a sandbox run — but a sane per-turn upper
   bound (e.g. 20 calls) is still worth asserting defensively so a
   confused model can't loop.

## 8. Testing plan (required before merge — see `AGENTS.md`)

| Layer | Tests |
| --- | --- |
| Domain functions (§3a) | Unit tests per function in `day-blocks.test.ts` (extend existing) covering: happy path, min-cardinality invariants (can't remove the last set/exercise/block), out-of-range indices, move to same index (no-op), superset add/remove edge cases |
| `assertEditableChange` (§3b) | Unit tests: allowed edits to planned sets, rejected edits to completed/skipped sets, rejected edits to locked sets, allowed structural add (new set/exercise/day never conflicts with existing editability) |
| Each new tool | Tool-level test with a fake `ToolContext` (pattern from `agent/lib/forge-client-context.test.ts`, `agent/lib/submit-plan-code-attempts.test.ts`): not-found athlete, not-editable rejection surfaced as a tool error (not a thrown exception), successful edit persists and returns the expected compact shape, `toModelOutput` never contains full plan JSON |
| Persistence guard fix (§3b) | Regression test on `savePlanActuals` proving a completed-set edit is now rejected server-side even without going through a tool |
| Integration | Extend `lib/chat/adapters/plan/eve-coach-reducer.test.ts`-style coverage if these tools should also update any client-visible state (tbd — see [§9](#9-does-the-client-need-to-know)) |

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

- [ ] §3a — TS block/exercise/set CRUD helpers
- [ ] §3b — `assertEditableChange` guard + `savePlanActuals` regression fix
- [ ] §3c — concurrency mitigation (start with re-validate-on-write)
- [ ] Read tool(s)
- [ ] `edit_athlete_plan_week` / `_day` / `_exercise` / `_set`
- [ ] `forge-tool-outputs.ts` — `EditAthletePlanOutput` type + guards
- [ ] `agent/instructions.md` — routing note (which tool for which coach phrasing, athlete resolution before edit, no full-plan narration — same style as the existing plan-codegen note)
- [ ] Tests (§8)
- [ ] Manual QA: edit a real in-progress assignment, confirm athlete app reflects it, confirm completed sets are untouched

## Out of scope (this phase)

- Bulk template → all-assignments propagation ([§6](#6-template-vs-assigned-edits-and-propagation))
- Reassignment-as-refresh semantics for `assign_plan_to_athletes`
- Marking sets completed/skipped via agent (`status`/`actual` fields)
- Cross-page live sync of assigned-plan edits into an open chat session
- Undo/version history for assigned-plan edits (tracked as an open question, §7.3)
