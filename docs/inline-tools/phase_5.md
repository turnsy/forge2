# Phase 5 — `@` mentions (`{kind, id}`)

**Status:** Not started

**Goal:** Send structured mention metadata with each message so the agent can resolve context lazily via read tools. No eager hydration in the system prompt.

**Depends on:** [phase_2.md](./phase_2.md) (lazy resolution uses read tools)

**Blocks:** None (can ship independently of Phase 4/6)

---

## Scope

### Request contract

- [ ] Extend `PlanChatRequestBody` with optional `mentions: { kind: 'athlete' | 'plan'; id: string }[]`
- [ ] Parse and validate in `parsePlanChatRequestBody`
- [ ] Dedupe mentions by `kind+id` per request
- [ ] **No** server-side pre-fetch of mention targets (lazy only)

### Client send path

- [ ] `useChatWorkspace.sendMessage` extracts mention segments from `PromptSegment[]`
- [ ] Map `PromptMentionSegment` → `{ kind, id }` (drop `label` from API payload)
- [ ] `streamPlanChat` / plan-chat client sends `mentions` alongside `prompt`
- [ ] Chat message history stores linear text (`@Label`) for display — mentions metadata optional in stored messages

### Orchestrator / prompt injection

- [ ] When `mentions.length > 0`, append compact block to system prompt:
  ```
  User referenced in this message:
  - athlete: <uuid>
  - plan: <uuid>
  Use get_athlete / get_plan tools to resolve details as needed.
  ```
- [ ] Do **not** inline athlete names or plan summaries (lazy tools only)

### Security

- [ ] Mention IDs are hints only — tools enforce ownership via RPCs
- [ ] Reject malformed mention kinds at parse time

### Tests

- [ ] `prompt-document` / segment extraction: mention segments → `{kind, id}[]`
- [ ] Parse request: valid/invalid mentions
- [ ] Orchestrator: mention block appended when present, omitted when empty
- [ ] End-to-end: `@athlete` in composer → API receives id

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/ai/plan-chat/types.ts` | Add `MentionRef` type |
| `forge-next/lib/ai/plan-chat/parse-request.ts` | Parse mentions |
| `forge-next/lib/prompts/mentions/extract-mentions.ts` | New — segments → refs |
| `forge-next/lib/chat/use-chat-workspace.ts` | Send mentions |
| `forge-next/lib/chat/adapters/plan/plan-chat-client.ts` | Include in fetch body |
| `forge-next/lib/ai/plan-chat/orchestrator.ts` | Inject mention index |
| `forge-next/lib/ai/plan-chat/parse-request.test.ts` | Extend |
| `forge-next/lib/prompts/mentions/extract-mentions.test.ts` | New |

---

## Done criteria

- [ ] `@` menu selections send `{kind, id}` to API
- [ ] System prompt lists mention refs only — no eager DB reads
- [ ] Agent can resolve via `get_athlete` / `get_plan` on demand
- [ ] Display text unchanged (`@Athlete Name` in thread)
- [ ] Tests cover extract, parse, and orchestrator injection
