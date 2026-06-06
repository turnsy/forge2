# Phase 4 — Vercel Sandbox + Python builder

**Goal:** Deterministic plan mutations via generated Python against a thin `forge_plan` library; sandbox filesystem contains **only** the current plan seed, the library, and the generated script.

**Depends on:** Phase 1 (Sandbox SDK + credentials)

**Blocks:** Phase 3 E2E, Phase 6 QA

---

## Agent actions

### Python library (`forge-next/sandbox/forge_plan/`)

- [x] Package layout: `__init__.py`, `plan.py`, `builders.py` aligned to schema v2.0.0
- [x] Docstrings on all public methods (used for cheat sheet generation)
- [x] Load seed from `current_plan.json` in working dir (empty template if missing)
- [x] Helpers (minimal v1 set — expand as needed):
  - `Plan.empty(name)` / `Plan.from_dict` / `Plan.from_json_file`
  - `add_week`, `add_day`, `add_exercise`, `add_set`
  - `to_dict()` → JSON-serializable matching `workout-plan.schema.json`

### API cheat sheet (for Gateway system prompt)

- [x] Script: `sandbox/scripts/generate_api_cheat_sheet.py` (`pnpm generate:forge-plan-cheat-sheet`)
- [x] Generated TS: `lib/ai/plan-chat/prompts/forge_plan_api_cheat_sheet.generated.ts` (checked in CI via `pnpm generate:check`)
- [x] Inject cheat sheet into plan-chat system prompt

### Sandbox executor (`lib/sandbox/`)

- [x] `runSandbox({ artifact: { type: "plan", currentPlan, generatedPython } })` — real VM in prod/dev; `stub.ts` for unit tests/CI only
- [x] Write **only**: `current_plan.json`, `forge_plan/`, `run.py`
- [x] **Do not** write upload summaries or `schema.json` into the sandbox
- [x] Run `python3 run.py`; read `output/plan.json`
- [x] `stop()` in `finally`
- [x] Timeouts and error codes: `SANDBOX_TIMEOUT`, `SANDBOX_FAILED`, `MISSING_OUTPUT`
- [x] Unit tests with mocked Sandbox client; opt-in integration: `RUN_SANDBOX_INTEGRATION=1`

### Codegen prompt assets

- [x] `lib/ai/plan-chat/prompts/python-codegen-prompt.ts` — forge_plan-only, no network, no upload reads

---

## Developer actions

- [ ] Install Vercel CLI; authenticate (`vercel login`)
- [ ] Ensure **Sandbox** enabled for project; add tokens to `.env.local` per Vercel docs
- [ ] Run integration test locally: `RUN_SANDBOX_INTEGRATION=1 pnpm test`
- [ ] Monitor Sandbox billing/latency during dev iteration

---

## Done criteria

- [x] Empty seed + generated script produces valid `workout-plan.schema.json` output
- [x] Iteration: updated `current_plan.json` in → coherent `plan.json` out
- [x] Sandbox always torn down on success/failure
- [x] Server rejects missing `output/plan.json` with `MISSING_OUTPUT`
- [x] Sandbox tree contains no upload/context files — `lib/sandbox/run-plan.test.ts`

---

## Future hook (not v1)

**Plan JSON** glimpse/traverse tools (read subtrees without full JSON in prompts). v1 uses `summarizePlan()` for the plan artifact and **upload file** list/read tools (Phase 3).
