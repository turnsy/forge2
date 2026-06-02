# Supabase Storage — ephemeral draft uploads

Plan generation v1 stores **normalized upload text** in Supabase Storage for the coach plan-chat flow. Objects are ephemeral (deleted after a run or by TTL janitor in Phase 2).

## Bucket

| Setting | Value |
| --- | --- |
| Bucket name | `draft-uploads` |
| Visibility | **Private** (signed URLs or service-role server reads only) |
| Max object size | Align with [overview.md](./overview.md) caps (25 MB total per message at API layer) |

Create the bucket in the Supabase Dashboard (Storage → New bucket) or add a migration when RLS policies are finalized.

## Object key layout

```
draft-uploads/{coachId}/{draftId}/{slug}.txt
```

- `coachId` — authenticated coach user id (UUID)
- `draftId` — client-generated draft/session id for one plan iteration workspace
- `slug` — sanitized filename stem (e.g. `weekly-volume` from `weekly-volume.csv`)

Helpers: `forge-next/lib/uploads/storage-paths.ts` (`DRAFT_UPLOADS_BUCKET`, `draftUploadObjectPath()`).

## RLS (developer action — Phase 2)

Policies should ensure:

- Coaches can **write** only under `{their coachId}/**`
- Coaches can **read** only their own prefix
- No public read access
- Athlete role has **no** access to this bucket in v1

## Lifecycle

- Written by `POST /api/coach/upload-context` (Phase 2)
- Referenced in plan-chat as `contextFileIds[]` (Phase 3)
- Normalized text is injected into **AI Gateway** prompts only — **never** mounted in Vercel Sandbox
- Delete after plan-chat completes or after ~24h (janitor TBD in Phase 2)

## Related code

| Module | Phase |
| --- | --- |
| `lib/uploads/context-storage.ts` | 2 |
| `lib/uploads/limits.ts` | 1 |
| `app/api/coach/upload-context/route.ts` | 2 |
