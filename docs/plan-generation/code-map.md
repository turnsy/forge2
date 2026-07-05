# Plan generation — code map

Authoritative layout for the coach plan agent (Eve cutover). See [overview.md](./overview.md) for architecture.

## Layering

| Layer | Path | Role |
| --- | --- | --- |
| Eve agent | `forge-next/agent/` | Model, tools, sandbox, skills, instructions, coach auth channel |
| Agent shared lib | `forge-next/agent/lib/` | DB helpers, artifact state, uploads, codegen prompt |
| Plan client adapter | `forge-next/lib/chat/adapters/plan/` | Eve catch-up, persistence, workspace hook, reducer |
| Generic chat state | `forge-next/lib/chat/` | Workspace reducer, session storage, snapshot types |
| Uploads | `forge-next/lib/uploads/` | Parsers, Storage I/O, batch validation |
| Eve sandbox workspace | `forge-next/agent/sandbox/workspace/forge_plan/` | Seeded into Eve sandbox VM (sync from `sandbox/forge_plan/`) |
| Python builder (source) | `forge-next/sandbox/forge_plan/` | Authoritative forge_plan sources; synced into agent sandbox |
| Plans | `forge-next/lib/plans/` | Schema types, `loadWorkoutPlan`, `summarizePlan` |

## Agent entrypoints

| Piece | Path |
| --- | --- |
| Agent definition | `agent/agent.ts` |
| Coach auth + forge session header | `agent/channels/eve.ts` |
| System instructions | `agent/instructions.md` |
| Dynamic upload notice | `agent/instructions/session-uploads.ts` |
| Codegen skill | `agent/skills/plan-codegen.ts` |
| Sandbox definition | `agent/sandbox/sandbox.ts` |
| Coach tools (15) | `agent/tools/*.ts` |

Eve is wired into Next via `withEve()` in `next.config.ts`. Agent HTTP surface is `/eve/v1/*` (health, sessions, turns).

## API routes (Forge)

| Route | Handler |
| --- | --- |
| `POST /api/coach/upload-context` | `app/api/coach/upload-context/route.ts` → `lib/uploads/upload-context-handler.ts` |

Coach auth required. **`x-forge-session-id`** header on Eve requests carries the Forge workspace session UUID (`chat_sessions.id`); upload Storage uses the same id. Session snapshots are saved via the `saveSessionSnapshot` server action during live turns and after Eve catch-up on reload.

## Coach UI

| Piece | Path |
| --- | --- |
| Page | `app/coach/(app)/page.tsx` |
| Workspace shell | `components/coach/coach-workspace.tsx` |
| Plan workspace hook | `lib/chat/adapters/plan/use-coach-plan-workspace.ts` (`useEveAgent`) |
| Eve catch-up on reload | `lib/chat/adapters/plan/coach-eve-session.ts` (`useCoachEveCatchUp`) |
| Eve stream restore | `lib/chat/adapters/plan/replay-eve-session.ts` (`restoreEveSessionEvents`) |
| Snapshot persistence | `lib/chat/adapters/plan/coach-eve-persist.ts` |
| Eve event reducer | `lib/chat/adapters/plan/eve-coach-reducer.ts` |
| Chat thread / composer | `components/chat/chat-thread.tsx`, `chat-composer.tsx` |
| Artifact preview | `components/artifact/artifact-preview.tsx` → `PlanViewer` |
| Prompt input | `components/prompt/prompt-composer.tsx` |

## Key modules

| Concern | Path |
| --- | --- |
| Workspace snapshot shape | `lib/chat/session-types.ts` (`CoachWorkspaceSnapshot`) |
| Legacy message extraction | `lib/chat/snapshot-messages.ts` |
| List session uploads (tool) | `agent/tools/list_session_files.ts` → `agent/lib/uploads.ts` |
| Submit plan code (tool) | `agent/tools/submit_plan_code.ts` → Eve sandbox |
| Artifact state (server) | `agent/lib/coach-artifact-state.ts` |
| Cheat sheet (generated) | `lib/plans/prompts/forge_plan_api_cheat_sheet.generated.ts` |
| Cheat sheet script | `sandbox/scripts/generate_api_cheat_sheet.py` |
| Storage paths | `lib/uploads/storage-paths.ts` (`sessionUploadPrefix`, bucket `session-uploads`) |

## Session storage

Forge keeps a **write-through cache** in `chat_sessions.snapshot`:

- `forgeSessionId`, `title`
- `eve`: `{ sessionId, continuationToken, streamIndex }` — Eve session cursor
- `eveEvents`: persisted Eve stream events for instant reload (cache; Eve is ground truth on catch-up)

Plan artifacts are recovered by replaying tool events through the Eve reducer, not stored separately in the snapshot.

## Tests (representative)

| Area | Path |
| --- | --- |
| Eve workspace hook | `lib/chat/adapters/plan/use-coach-plan-workspace.test.tsx` |
| Eve catch-up | `lib/chat/adapters/plan/coach-eve-session.test.tsx` |
| Eve restore | `lib/chat/adapters/plan/replay-eve-session.test.ts` |
| Eve persistence | `lib/chat/adapters/plan/coach-eve-persist.test.ts` |
| Eve reducer | `lib/chat/adapters/plan/eve-coach-reducer.test.ts` |
| Snapshot types | `lib/chat/session-types.test.ts` |
| Agent tools | `agent/tools/*.test.ts` (as added) |

Vitest excludes `.eve/dev-runtime/snapshots/**` (Eve dev-runtime copies).

## Naming notes

- **`forgeSessionId`** — client workspace id (`chat_sessions.id`); upload prefix and `x-forge-session-id` header.
- **`eve.sessionId`** — durable Eve agent conversation id for resume.
- **`session-uploads` bucket** — Supabase Storage for normalized upload text; objects keyed by `{coachId}/{forgeSessionId}/`.
- **Tool names** — unchanged from v1 (`list_session_files`, `submit_plan_code`, …).
