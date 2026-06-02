# Plan generation — implementation guide

Documentation for the coach plan-creation chat pipeline (v1).

## Start here

- **[overview.md](./overview.md)** — architecture, decisions, upload policy, done definition
- **[supabase-draft-uploads.md](./supabase-draft-uploads.md)** — Storage bucket `draft-uploads/` layout (Phase 1+)
- **Phases** (build in order):
  1. [Foundation](./phases/phase-1-foundation.md)
  2. [Upload normalization](./phases/phase-2-upload-normalization.md)
  3. [Chat API + AI Gateway](./phases/phase-3-chat-api.md)
  4. [Vercel Sandbox + Python builder](./phases/phase-4-sandbox.md)
  5. [Client workspace](./phases/phase-5-client-workspace.md)
  6. [Integration & QA](./phases/phase-6-integration.md)

## Roles

| | **Agent (Cursor / cloud)** | **Developer (you)** |
| --- | --- | --- |
| Typical work | Code, tests, modules, UI, route handlers | Vercel project, AI Gateway, Sandbox credentials, env vars, manual QA |
| Blocking | Cannot merge sandbox/Gateway features without your secrets | Cannot ship v1 without agent implementation |

Each phase file has checklists for both roles.
