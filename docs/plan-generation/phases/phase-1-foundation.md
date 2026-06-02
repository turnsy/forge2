# Phase 1 — Foundation

**Goal:** Repo and environment ready for AI Gateway + Vercel Sandbox from local dev and preview deploys.

**Depends on:** Phase 0 decisions (locked — see [overview.md](../overview.md))

**Blocks:** Phases 2–6

---

## Agent actions

- [ ] Update root [AGENTS.md](../../../AGENTS.md): E2B → **Vercel Sandbox**; link to `docs/plan-generation/`
- [ ] Extend [forge-next/.env.example](../../../forge-next/.env.example) with documented vars (no secrets)
- [ ] Add dependencies to `forge-next/package.json`:
  - `ai`, `@ai-sdk/*` (per Gateway setup)
  - `@vercel/sandbox` (or current official package name from Vercel docs)
  - Upload parsers: e.g. `pdf-parse` or equivalent, `xlsx` / `exceljs` for XLSX (evaluate bundle size for server-only)
- [ ] Add `lib/uploads/limits.ts` with caps from overview (exported constants + tests)
- [ ] Scaffold empty modules (no behavior yet): `lib/ai/plan-chat/`, `lib/sandbox/`, `lib/uploads/context-storage.ts`, `sandbox/forge_plan/`
- [ ] Document Supabase Storage bucket/path for ephemeral `draft-uploads/` (see Phase 2) → [supabase-draft-uploads.md](../supabase-draft-uploads.md)
- [ ] Add Vitest smoke test that `limits` and env helpers load

---

## Developer actions

- [ ] Confirm Forge Next.js app is linked on Vercel (`vercel link` in `forge-next/` if needed)
- [ ] Enable **Vercel AI Gateway** on the team/project; note default model(s) for chat + codegen
- [ ] Create/obtain **AI Gateway API key** (or OIDC if using Vercel-managed auth in production)
- [ ] Enable **Vercel Sandbox** for the project; confirm quota and runtime supports **Python**
- [ ] Pull env locally: `vercel env pull .env.local` (or set manually for sandbox + gateway)
- [ ] Document in your password manager which vars are preview vs production

### Environment variables (expected)

| Variable | Purpose |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Gateway authentication (name per Vercel docs at implementation time) |
| `VERCEL_OIDC_TOKEN` / team token | Sandbox API access for local dev (per current Sandbox docs) |
| Existing Supabase vars | Unchanged — coach auth still required |

Exact names should match Vercel’s latest Sandbox + Gateway docs when the agent wires Phase 3–4.

---

## Done criteria

- [ ] `pnpm install` succeeds in `forge-next/`
- [ ] `pnpm test` passes
- [ ] `pnpm dev` starts; no runtime errors from new empty modules
- [ ] Developer can run a one-line script or route stub that **creates and destroys** a sandbox (agent provides stub in Phase 4 early, or developer validates manually after Phase 4)
- [ ] AGENTS.md reflects Vercel Sandbox

---

## Notes

- Do **not** add E2B packages.
- Keep all new server logic under `forge-next/lib/` per AGENTS.md.
