# Phase 5 — `@` mentions (inline in prompt)

**Status:** Not started

**Goal:** Serialize mention metadata **inline** in the user `prompt` string where mentions appear, preserving sentence semantics. No separate API field or system-prompt injection.

**Depends on:** [phase_2.md](./phase_2.md) (agent resolves ids lazily via `get_athlete` / `get_plan` when needed)

**Blocks:** None (can ship independently of Phase 4/6)

---

## Approach

Mention segments in the composer become inline machine-readable refs in the agent-facing prompt. Display text in the chat thread stays human-readable (`@Label` only).

**Composer display:**

```
Add a deload week to @Summer Block for @Jane Smith
```

**Serialized `prompt` sent to API:**

```
Add a deload week to @Summer Block {"kind":"plan","id":"…"} for @Jane Smith {"kind":"athlete","id":"…"}
```

- Payload is tiny (~50 bytes per mention).
- Sentence structure is preserved — no appendix block in the system prompt.
- Agent may call `get_plan` / `get_athlete` lazily when it needs more than the id.
- Inline ids alone may suffice for some requests (e.g. `assign_plan`).

Use `kind` (matches existing `PromptMentionSegment`), not `type`.

---

## Scope

### Serialization

- [ ] Add `serializePromptForAgent(segments: PromptSegment[]): string` in `lib/prompts/prompt-document.ts`
- [ ] Mention segments → `@${label} {"kind":"${kind}","id":"${id}"}`
- [ ] Text segments unchanged; strip zero-width spaces as today
- [ ] Keep existing `serializePromptDocument` / `getLinearText` for **display** (`@Label` only)

### Client send path

- [ ] `useChatWorkspace.sendMessage` uses `serializePromptForAgent` for the API `prompt` field
- [ ] Message history stores display text (`getLinearText`) in `messages` — not the inline JSON
- [ ] No new fields on `PlanChatRequestBody` — single `prompt` string only

### Server

- [ ] No mention parsing required in `parsePlanChatRequestBody` (prompt is opaque text)
- [ ] No orchestrator system-prompt injection for mentions

### Security

- [ ] Inline ids are hints — `get_athlete` / `get_plan` / `assign_plan` enforce ownership via RPCs
- [ ] Client can only insert ids from `@` menu selections (existing search APIs)

### Tests

- [ ] `serializePromptForAgent`: text + mention + text → correct inline format
- [ ] Multiple mentions in one prompt preserve order and spacing
- [ ] Display serialization unchanged (`@Label` without JSON in thread)
- [ ] End-to-end: composer mention → API prompt contains inline `{"kind","id"}`

---

## Files

| File | Action |
| --- | --- |
| `forge-next/lib/prompts/prompt-document.ts` | Add `serializePromptForAgent` |
| `forge-next/lib/prompts/prompt-document.test.ts` | Extend |
| `forge-next/lib/chat/use-chat-workspace.ts` | Use agent serializer for API |

---

## Done criteria

- [ ] `@` menu selections appear inline in agent-facing `prompt`
- [ ] Chat thread display unchanged (`@Athlete Name` without JSON)
- [ ] No separate `mentions` API field
- [ ] No system-prompt mention block
- [ ] Tests cover inline serialization
