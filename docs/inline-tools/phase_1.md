# Phase 1 — Agent foundation

**Status:** Done

**Goal:** Replace the monolithic plan-codegen system prompt with a general coach agent prompt; move Python/codegen rules and artifact summary behind tools; raise the tool-step budget.

**Depends on:** Existing plan-chat orchestrator (`lib/ai/plan-chat/`)

**Blocks:** Phases 2–8 (all tool work assumes new prompt shape)

---

## Scope

### General system prompt

- [x] Rewrite `buildPlanChatSystemPrompt` → `buildCoachAgentSystemPrompt` (deprecated alias kept)
- [x] High-level persona: strength & conditioning coach assistant on Forge
- [x] High-level tool routing guide:
  - [x] **Read context** — `list_athletes` / `get_athlete`, `list_plans` / `get_plan`, `list_pending_invites`, session file tools
  - [x] **Mutate** — `accept_coach_link`, `reject_coach_link`, `assign_plan`
  - [x] **Open saved plan for editing** — `set_current_artifact(planId)` only when user wants to edit a saved plan not already in preview
  - [x] **Create or iterate in-preview plan** — `summarize_current_artifact` (if needed) → `get_plan_codegen_guide` → `submit_plan_code`
  - [x] Explicit rule: **`get_plan` and `assign_plan` do not set the preview**
  - [x] Explicit rule: **`set_current_artifact` is not used for fresh plan creation**
- [x] Explicit rule: **call `get_plan_codegen_guide` before any `submit_plan_code`**
- [x] Explicit rule: **call `summarize_current_artifact` when you need context about the current in-preview plan**
- [x] **Remove** inline `summarizePlan(currentArtifact)` block from system prompt
- [x] Keep assistant reply style rules (brief chat, no implementation jargon)
- [x] Remove inline `buildPythonCodegenRules()` and cheat sheet from system prompt

### `get_plan_codegen_guide` tool

- [x] Added in `lib/ai/coach-agent/tools/foundation-tools.ts`
- [x] `execute` returns `buildPythonCodegenRules()` (includes cheat sheet)
- [x] Tool description warns: must be called before `submit_plan_code`
- [x] Unit test: tool returns non-empty guide string

### `summarize_current_artifact` tool

- [x] Reads orchestrator's `currentArtifact` from tool context
- [x] Returns `{ summary }` or `{ summary: null, message: "No plan in preview." }`
- [x] Unit tests for both cases

### Constants

- [x] Bump `PLAN_CHAT_MAX_TOOL_STEPS` from `12` → `50`
- [x] No other tests asserted old value

### Orchestrator wiring

- [x] Orchestrator uses `buildCoachAgentSystemPrompt` (no `summarizePlan` in system string)
- [x] Pass `currentArtifact` into `createCoachAgentTools`
- [x] Register foundation tools alongside session + codegen tools

### Notes

- `createCoachAgentTools` factory introduced; grows in later phases.
- `buildPlanChatSystemPrompt` kept as deprecated alias for exports.

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/plan-chat/prompts/system-prompts.ts` | Rewritten |
| `forge-next/lib/ai/coach-agent/tools/foundation-tools.ts` | New |
| `forge-next/lib/ai/coach-agent/tools/create-coach-agent-tools.ts` | New |
| `forge-next/lib/ai/plan-chat/constants.ts` | Bump step limit |
| `forge-next/lib/ai/plan-chat/orchestrator.ts` | Wire new prompt + tools |
| `forge-next/lib/ai/plan-chat/prompts/system-prompts.test.ts` | Updated |
| `forge-next/lib/ai/coach-agent/tools/foundation-tools.test.ts` | New |

---

## Done criteria

- [x] System prompt no longer contains cheat sheet, Python codegen rules, or `summarizePlan` inline
- [x] `get_plan_codegen_guide` tool registered and tested
- [x] `summarize_current_artifact` tool registered and tested
- [x] Routing guide mentions `set_current_artifact` for saved-plan edit intents only
- [x] `PLAN_CHAT_MAX_TOOL_STEPS = 50`
- [x] Existing plan-generation integration tests still pass
- [x] Unit tests for prompt builder assert key sections present/absent
