# Plan generation — code map

Authoritative layout for the coach plan agent (Eve cutover). See [overview.md](./overview.md) for architecture.

## Layering

| Layer | Path | Role |
| --- | --- | --- |
| Eve agent | `forge-next/agent/` | Model, tools, sandbox, skills, instructions, coach auth channel |
| Agent shared lib | `forge-next/agent/lib/` | DB helpers, artifact state, uploads, codegen prompt |
| Plan client adapter | `forge-next/lib/chat/adapters/plan/` | `useEveAgent` workspace hook, Eve event reducer |
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
| `POST /api/coach/save-session` | Beacon/unload save of slim workspace snapshot (no message array) |

Coach auth required. **`x-forge-session-id`** header on Eve requests carries the Forge workspace session UUID (`chat_sessions.id`); upload Storage uses the same id.

## Coach UI

| Piece | Path |
| --- | --- |
| Page | `app/coach/(app)/page.tsx` |
| Workspace shell | `components/coach/coach-workspace.tsx` |
| Plan workspace hook | `lib/chat/adapters/plan/use-coach-plan-workspace.ts` (`useEveAgent`) |
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

Forge keeps a **bookmark snapshot** in `chat_sessions.snapshot`:

- `forgeSessionId`, `title`
- `eve`: `{ sessionId, continuationToken, streamIndex, events? }` for resume
- `ui`: `{ planId, artifactTitle, currentArtifact }` for preview without an active Eve session

Eve owns conversation history; legacy snapshots with `messages[]` are still readable via `getSnapshotMessages()`.

## Tests (representative)

| Area | Path |
| --- | --- |
| Eve workspace hook | `lib/chat/adapters/plan/use-coach-plan-workspace.test.tsx` |
| Eve reducer | `lib/chat/adapters/plan/eve-coach-reducer.ts` (via hook tests) |
| Snapshot types | `lib/chat/session-types.test.ts` |
| Agent tools | `agent/tools/*.test.ts` (as added) |

Vitest excludes `.eve/dev-runtime/snapshots/**` (Eve dev-runtime copies).

## Naming notes

- **`forgeSessionId`** — client workspace id (`chat_sessions.id`); upload prefix and `x-forge-session-id` header.
- **`eve.sessionId`** — durable Eve agent conversation id for resume.
- **`session-uploads` bucket** — Supabase Storage for normalized upload text; objects keyed by `{coachId}/{forgeSessionId}/`.
- **Tool names** — unchanged from v1 (`list_session_files`, `submit_plan_code`, …).
