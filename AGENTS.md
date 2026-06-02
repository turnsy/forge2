# AGENTS.md

Build a coaching app with separate `/coach` and `/athlete` experiences using Next.js App Router, Supabase Auth/Postgres, Next.js AI, JSON schemas, and **Vercel Sandbox** (Python) for plan artifact execution.

**Plan generation (v1):** See [docs/plan-generation/README.md](./docs/plan-generation/README.md) — coach-only in-memory plan create/iterate via chat, Vercel AI Gateway, server-side upload normalization, **Vercel Sandbox** (Python) codegen + `loadWorkoutPlan()` validation. No DB writes in v1. Ephemeral uploads: [supabase-draft-uploads.md](./docs/plan-generation/supabase-draft-uploads.md).

Rules:

- Keep role-specific surfaces under `app/coach/**` and `app/athlete/**`.
- Reuse domain logic and UI wherever possible; avoid duplicated coach/athlete implementations.
- All reusable components must live in `/forge-next/components`.
- Maintain a central shared theme and a clean, minimal design system used across both apps.
- Prefer composition and shared primitives over one-off styled components.
- Put shared UI in `forge-next/components/ui/`; reuse those primitives before adding bespoke components in feature folders.
- Keep business logic, permissions, AI transforms, and data shaping out of React page files.
- Enforce auth and authorization on the server.
- Use JSON Schema as the source of truth for structured artifacts and AI I/O.
- Treat plans as structured, versioned artifacts.
- Keep AI prompts, parsing, validation, and repair logic in dedicated modules.
- Prefer typed service/repository layers for Supabase access.
- Write small, testable modules with clear boundaries.
- Require strong unit coverage for validators, permissions, transforms, and domain logic.
- Test components that carry behavior (validation, interaction, conditional UI); thin layout wrappers do not need their own tests—extract any logic worth asserting into `lib/`.
- Do not merge non-trivial work without tests.
- Include loading, empty, error, and success states for user-facing flows.
