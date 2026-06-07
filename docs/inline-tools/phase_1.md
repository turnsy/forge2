# Phase 1 — Agent foundation

**Status:** Not started

**Goal:** Replace the monolithic plan-codegen system prompt with a general coach agent prompt; move Python/codegen rules behind a `get_plan_codegen_guide` tool; raise the tool-step budget.

**Depends on:** Existing plan-chat orchestrator (`lib/ai/plan-chat/`)

**Blocks:** Phases 2–8 (all tool work assumes new prompt shape)

---

## Scope

### General system prompt

- [ ] Rewrite `buildPlanChatSystemPrompt` → `buildCoachAgentSystemPrompt` (or extend in place with clear sections)
- [ ] High-level persona: strength & conditioning coach assistant on Forge
- [ ] High-level tool routing guide (when to list/read athletes, when to assign, when to load artifact, when to codegen)
- [ ] Explicit rule: **call `get_plan_codegen_guide` before any `submit_plan_code`**
- [ ] Keep `summarizePlan(currentArtifact)` block when artifact is active (compact iteration context)
- [ ] Keep assistant reply style rules (brief chat, no implementation jargon)
- [ ] Remove inline `buildPythonCodegenRules()` and cheat sheet from system prompt
- [ ] Remove “plan generation scope” prose that duplicates tool descriptions (keep only essentials)

### `get_plan_codegen_guide` tool

- [ ] Add tool in `create-plan-chat-tools.ts` (or new `create-coach-agent-tools.ts` if splitting)
- [ ] `execute` returns concatenation of current `buildPythonCodegenRules()` + `FORGE_PLAN_API_CHEAT_SHEET`
- [ ] Tool description warns: must be called before `submit_plan_code`
- [ ] Unit test: tool returns non-empty guide string

### Constants

- [ ] Bump `PLAN_CHAT_MAX_TOOL_STEPS` from `12` → `50` in `lib/ai/plan-chat/constants.ts`
- [ ] Update any tests that assert the old value

### Orchestrator wiring

- [ ] Orchestrator uses new prompt builder
- [ ] Register `get_plan_codegen_guide` alongside existing session + codegen tools
- [ ] No behavior change to sandbox path yet (still queues Python after turn)

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/plan-chat/prompts/system-prompts.ts` | Rewrite |
| `forge-next/lib/ai/plan-chat/prompts/python-codegen-prompt.ts` | Keep — consumed by guide tool |
| `forge-next/lib/ai/plan-chat/tools/create-plan-chat-tools.ts` | Extend or split |
| `forge-next/lib/ai/plan-chat/constants.ts` | Bump step limit |
| `forge-next/lib/ai/plan-chat/orchestrator.ts` | Wire new prompt + tool |
| `forge-next/lib/ai/plan-chat/prompts/system-prompts.test.ts` | New/update |

---

## Done criteria

- [ ] System prompt no longer contains cheat sheet or Python codegen rules inline
- [ ] `get_plan_codegen_guide` tool registered and tested
- [ ] `PLAN_CHAT_MAX_TOOL_STEPS = 50`
- [ ] Existing plan-generation integration tests still pass (may need model to call guide tool — update test stubs if needed)
- [ ] Unit tests for prompt builder assert key sections present/absent
