# Phase 1 — Agent foundation

**Status:** Not started

**Goal:** Replace the monolithic plan-codegen system prompt with a general coach agent prompt; move Python/codegen rules and artifact summary behind tools; raise the tool-step budget.

**Depends on:** Existing plan-chat orchestrator (`lib/ai/plan-chat/`)

**Blocks:** Phases 2–8 (all tool work assumes new prompt shape)

---

## Scope

### General system prompt

- [ ] Rewrite `buildPlanChatSystemPrompt` → `buildCoachAgentSystemPrompt` (or extend in place with clear sections)
- [ ] High-level persona: strength & conditioning coach assistant on Forge
- [ ] High-level tool routing guide:
  - [ ] **Read context** — `list_athletes` / `get_athlete`, `list_plans` / `get_plan`, `list_pending_invites`, session file tools
  - [ ] **Mutate** — `accept_coach_link`, `reject_coach_link`, `assign_plan`
  - [ ] **Open saved plan for editing** — `set_current_artifact(planId)` only when user wants to edit a saved plan not already in preview (e.g. “edit Summer Block”, “add a week to this plan”)
  - [ ] **Create or iterate in-preview plan** — `summarize_current_artifact` (if needed) → `get_plan_codegen_guide` → `submit_plan_code`
  - [ ] Explicit rule: **`get_plan` and `assign_plan` do not set the preview**
  - [ ] Explicit rule: **`set_current_artifact` is not used for fresh plan creation** (no saved `planId` yet)
- [ ] Explicit rule: **call `get_plan_codegen_guide` before any `submit_plan_code`**
- [ ] Explicit rule: **call `summarize_current_artifact` when you need context about the current in-preview plan** (do not assume it is in the system prompt)
- [ ] **Remove** inline `summarizePlan(currentArtifact)` block from system prompt
- [ ] Keep assistant reply style rules (brief chat, no implementation jargon)
- [ ] Remove inline `buildPythonCodegenRules()` and cheat sheet from system prompt
- [ ] Remove “plan generation scope” prose that duplicates tool descriptions (keep only essentials)

### `get_plan_codegen_guide` tool

- [ ] Add tool in `create-plan-chat-tools.ts` (or new `create-coach-agent-tools.ts` if splitting)
- [ ] `execute` returns concatenation of current `buildPythonCodegenRules()` + `FORGE_PLAN_API_CHEAT_SHEET`
- [ ] Tool description warns: must be called before `submit_plan_code`
- [ ] Unit test: tool returns non-empty guide string

### `summarize_current_artifact` tool

- [ ] Add tool with no required inputs (reads orchestrator's `currentArtifact` from tool context)
- [ ] `execute` returns `{ summary: string }` via existing `summarizePlan(currentArtifact)`
- [ ] When no artifact is active, return `{ summary: null, message: "No plan in preview." }`
- [ ] Tool description: use before iterating on the in-preview plan or when user asks about the current draft
- [ ] Unit test: returns summary when artifact present; null when absent

### Constants

- [ ] Bump `PLAN_CHAT_MAX_TOOL_STEPS` from `12` → `50` in `lib/ai/plan-chat/constants.ts`
- [ ] Update any tests that assert the old value

### Orchestrator wiring

- [ ] Orchestrator uses new prompt builder (no `summarizePlan` in system string)
- [ ] Pass `currentArtifact` into tool context for `summarize_current_artifact`
- [ ] Register `get_plan_codegen_guide` and `summarize_current_artifact` alongside existing session + codegen tools
- [ ] No behavior change to sandbox path yet (still queues Python after turn)

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/plan-chat/prompts/system-prompts.ts` | Rewrite |
| `forge-next/lib/ai/plan-chat/prompts/python-codegen-prompt.ts` | Keep — consumed by guide tool |
| `forge-next/lib/ai/plan-chat/tools/create-plan-chat-tools.ts` | Extend or split |
| `forge-next/lib/ai/plan-chat/constants.ts` | Bump step limit |
| `forge-next/lib/ai/plan-chat/orchestrator.ts` | Wire new prompt + tools |
| `forge-next/lib/ai/plan-chat/prompts/system-prompts.test.ts` | New/update |
| `forge-next/lib/ai/plan-chat/tools/summarize-current-artifact.test.ts` | New |

---

## Done criteria

- [ ] System prompt no longer contains cheat sheet, Python codegen rules, or `summarizePlan` inline
- [ ] `get_plan_codegen_guide` tool registered and tested
- [ ] `summarize_current_artifact` tool registered and tested
- [ ] Routing guide mentions `set_current_artifact` for saved-plan edit intents only
- [ ] `PLAN_CHAT_MAX_TOOL_STEPS = 50`
- [ ] Existing plan-generation integration tests still pass (may need model to call guide + summary tools — update test stubs if needed)
- [ ] Unit tests for prompt builder assert key sections present/absent
