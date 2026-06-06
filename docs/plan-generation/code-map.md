# Plan generation — code map

Authoritative layout for the coach plan-chat pipeline (v1). See [overview.md](./overview.md) for architecture.

## Layering

| Layer | Path | Role |
| --- | --- | --- |
| Server orchestration | `forge-next/lib/ai/plan-chat/` | Gateway, tools, SSE encode, sandbox handoff |
| Client adapters | `forge-next/lib/plan-chat/` | Fetch clients, SSE decode/map, coach workspace hook |
| Generic chat state | `forge-next/lib/chat/` | Workspace reducer, selectors, shared SSE helpers |
| Uploads | `forge-next/lib/uploads/` | Parsers, Storage I/O, batch validation |
| Sandbox | `forge-next/lib/sandbox/` | Vercel Sandbox executor (+ test stub in `stub.ts`) |
| Python builder | `forge-next/sandbox/forge_plan/` | Bundled into sandbox VM |
| Plans | `forge-next/lib/plans/` | Schema types, `loadWorkoutPlan`, `summarizePlan` |

## API routes

| Route | Handler |
| --- | --- |
| `POST /api/coach/upload-context` | `app/api/coach/upload-context/route.ts` → `lib/uploads/upload-context-handler.ts` |
| `POST /api/coach/plan-chat` | `app/api/coach/plan-chat/route.ts` → `lib/ai/plan-chat/orchestrator.ts` |

Both require coach auth. **`sessionId` is required** on every request (workspace session UUID; Storage prefix when uploads exist).

## Coach UI

| Piece | Path |
| --- | --- |
| Page | `app/coach/(app)/page.tsx` |
| Workspace shell | `components/coach/coach-workspace.tsx` |
| Chat thread / composer | `components/chat/chat-thread.tsx`, `chat-composer.tsx` |
| Artifact preview | `components/artifact/artifact-preview.tsx` → `PlanViewer` |
| Prompt input | `components/prompt/prompt-composer.tsx` |
| Shared UI | `components/ui/` (`chat-bubble`, `resizable-split-pane`, …) |

## Key modules

| Concern | Path |
| --- | --- |
| List session uploads (tools) | `lib/uploads/list-session-uploads.ts` |
| Storage paths | `lib/uploads/storage-paths.ts` (`sessionUploadPrefix`, bucket `draft-uploads`) |
| Model tools | `lib/ai/plan-chat/tools/create-plan-chat-tools.ts` |
| Cheat sheet (generated) | `lib/ai/plan-chat/prompts/forge_plan_api_cheat_sheet.generated.ts` |
| Cheat sheet script | `sandbox/scripts/generate_api_cheat_sheet.py` |
| Sandbox executor | `lib/sandbox/run-plan.ts` |
| Test stub (CI only) | `lib/sandbox/stub.ts` |

## Tests (representative)

| Area | Path |
| --- | --- |
| Phase 6 integration (Task 2) | `lib/ai/plan-chat/plan-generation.integration.test.ts` (planned) |
| Orchestrator | `lib/ai/plan-chat/orchestrator.test.ts` |
| Sandbox file whitelist | `lib/sandbox/run-plan.test.ts` |
| Live sandbox (opt-in) | `lib/sandbox/integration.test.ts` (`RUN_SANDBOX_INTEGRATION=1`) |

## Naming notes

- **`sessionId`** — client workspace / conversation id (required on upload + plan-chat). Not every session builds a plan artifact.
- **`draft-uploads` bucket** — Supabase Storage bucket name (historical); objects keyed by `{coachId}/{sessionId}/`.
- **Tool names** — `list_draft_files` / `read_draft_file` refer to normalized upload files in Storage, not saved plan drafts.
