# Phase 8 — Integration tests & QA

**Status:** Not started

**Goal:** End-to-end confidence across generalized agent, tools, mentions, layout, and save continuity.

**Depends on:** Phases 1–7

**Blocks:** None (ship gate)

---

## Scope

### Integration tests (server)

- [ ] General chat turn (no tools) — brief reply, no artifact
- [ ] `list_athletes` + `get_athlete` tool chain with mocked DB
- [ ] `assign_plan` mutation with mocked RPC
- [ ] `get_plan_codegen_guide` called before `submit_plan_code` in plan generation flow
- [ ] `set_current_artifact` emits artifact event without LLM seeing blob
- [ ] Mentions in request body → system prompt mention index present
- [ ] `get_plan` response assertion: no `plan_data` key anywhere in tool results

### Client / component tests

- [ ] Centered chat → split transition on artifact
- [ ] Mention extract → API payload
- [ ] Save redirect snapshot round-trip
- [ ] Edit mode continued session hydration

### Manual QA checklist

- [ ] `/coach` — ask a general question (no split, no artifact)
- [ ] `/coach` — generate a plan (centered until artifact, then split)
- [ ] `/coach` — `@` athlete, ask about their plan (agent uses lazy tools)
- [ ] `/coach` — agent assigns plan to athlete via chat
- [ ] `/coach` — agent accepts pending invite via chat
- [ ] `/coach` — “edit plan X” → `set_current_artifact` → split + preview
- [ ] Save new plan → redirect to edit → chat retained
- [ ] Edit route — iterate plan, save version, back link
- [ ] Upload file + generate plan (session tools still work)
- [ ] Restart conversation clears artifact and returns to welcome

### Regression guards

- [ ] Existing `plan-generation.integration.test.ts` updated for new prompt/tool flow
- [ ] No full plan JSON in logged tool outputs (spot-check)
- [ ] `PLAN_CHAT_MAX_TOOL_STEPS = 50` not causing runaway loops in tests

### Documentation

- [ ] `docs/plan-generation/overview.md` — add pointer to inline-tools for v2 agent scope
- [ ] `docs/inline-tools/README.md` — mark phases complete as shipped
- [ ] `AGENTS.md` — no change required unless agent behavior summary needed

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/plan-chat/plan-generation.integration.test.ts` | Update |
| `forge-next/lib/ai/coach-agent/coach-agent.integration.test.ts` | New |
| `forge-next/components/coach/coach-workspace.test.tsx` | Extend |
| `docs/inline-tools/README.md` | Status updates |

---

## Done criteria

- [ ] All integration tests pass in CI
- [ ] Manual QA checklist completed
- [ ] No delete tools exposed
- [ ] Coach-only surface verified (no athlete routes touched)
- [ ] Phase 1–7 checkboxes marked complete in their respective docs
