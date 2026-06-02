# Phase 4 — Vercel Sandbox + Python builder

**Goal:** Deterministic plan mutations via generated Python against a thin `forge_plan` library; sandbox filesystem contains **only** the current plan seed, the library, and the generated script.

**Depends on:** Phase 1 (Sandbox SDK + credentials)

**Blocks:** Phase 3 E2E, Phase 6 QA

---

## Agent actions

### Python library (`forge-next/sandbox/forge_plan/`)

- [ ] Package layout: `__init__.py`, `plan.py`, `builders.py` aligned to schema v2.0.0
- [ ] Docstrings on all public methods (used for cheat sheet generation)
- [ ] Load seed from `current_plan.json` in working dir (empty template if missing)
- [ ] Helpers (minimal v1 set — expand as needed):
  - `Plan.empty(name)` / `Plan.from_dict`
  - `add_week`, `add_day`, `add_exercise`, `add_set` (names TBD to match schema)
  - `to_dict()` → JSON-serializable matching `workout-plan.schema.json`
- [ ] `summarize()` or module-level helper for optional debug prints inside sandbox (not required for v1 UX)

### API cheat sheet (short — for Gateway system prompt)

- [ ] Script to **autogenerate** cheat sheet from pydoc/docstrings (e.g. `generate_api_cheat_sheet.py` or build step in `package.json`)
- [ ] **Hard limit** on output size (e.g. ≤ 2 KB / ~40 lines) — signatures + one line each; truncate with “see forge_plan for more” if needed
- [ ] Commit generated `forge_plan_api_cheat_sheet.txt` or generate at build time in `lib/ai/plan-chat/`
- [ ] Inject cheat sheet into codegen system prompt in Phase 3 (not duplicated as `schema.json` in sandbox)

### Sandbox executor (`lib/sandbox/`)

- [ ] `runPlanSandbox({ currentPlan, generatedPython })`
- [ ] Write **only** these files into the VM:
  - `current_plan.json` (from client artifact)
  - `forge_plan/` (library tree)
  - `run.py` (Python source from Gateway)
- [ ] **Do not** write upload summaries, `input_context.*`, or `schema.json` into the sandbox
- [ ] Run `python run.py`; read `output/plan.json`
- [ ] `stop()` / dispose sandbox in `finally`
- [ ] Timeouts and error codes: `SANDBOX_TIMEOUT`, `SANDBOX_FAILED`, `MISSING_OUTPUT`
- [ ] Unit tests with mocked Sandbox client; opt-in integration test: `RUN_SANDBOX_INTEGRATION=1`

### Codegen prompt assets

- [ ] `lib/ai/plan-chat/python-codegen-prompt.ts` — constraints:
  - Only use `forge_plan` public API (per cheat sheet)
  - Read `current_plan.json`, write `output/plan.json`
  - No network, no arbitrary imports, no reading upload files (none exist in VM)
  - Keep script short

---

## Developer actions

- [ ] Install Vercel CLI; authenticate (`vercel login`)
- [ ] Ensure **Sandbox** enabled for project; add tokens to `.env.local` per Vercel docs
- [ ] Run integration test locally: `RUN_SANDBOX_INTEGRATION=1 pnpm test` (once agent adds it)
- [ ] If Python runtime version matters, pin in docs and match Sandbox template
- [ ] Monitor Sandbox billing/latency during dev iteration

---

## Done criteria

- [ ] Empty seed + generated script produces valid `workout-plan.schema.json` output
- [ ] Iteration: updated `current_plan.json` in → coherent `plan.json` out
- [ ] Sandbox always torn down on success/failure
- [ ] Server rejects missing `output/plan.json` with `MISSING_OUTPUT`
- [ ] Sandbox tree contains no upload/context files (assert in integration test)

---

## Future hook (not v1)

Plan glimpse/traverse tools for agents (read subtrees without full JSON in prompts). v1 uses server-side `summarizePlan()` for the LLM and full `current_plan.json` in the sandbox only.
