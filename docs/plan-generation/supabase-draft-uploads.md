# Supabase Storage — ephemeral draft uploads

Plan generation v1 stores **normalized upload text** in Supabase Storage for the coach plan-chat flow. Objects are ephemeral (deleted after a run or by TTL janitor).

## Bucket

| Setting | Value |
| --- | --- |
| Bucket name | `draft-uploads` |
| Visibility | **Private** (server reads via authenticated Supabase client + RLS) |
| Max object size | Enforced at API layer per [overview.md](./overview.md) |

Create via `supabase/migrations/20260602120000_draft_uploads_storage.sql`.

## Object key layout

```text
draft-uploads/{coachId}/{draftId}/{slug}.txt
```

- `coachId` — authenticated coach user id
- `draftId` — client workspace / conversation id (one plan-chat session)
- `slug` — see below

### Slugs

| Source | Example slug |
| --- | --- |
| CSV / PDF | `my-plan` from `My Plan.csv` |
| XLSX (per sheet) | `my-workbook__summary`, `my-workbook__volume` |

One physical `.xlsx` with three sheets → **three** objects under the same `{draftId}`.

Helpers:

- `draftUploadObjectPath()`, `draftUploadPrefix()` — `lib/uploads/storage-paths.ts`
- `draftUploadSlug()` — `lib/uploads/file-utils.ts`
- `listDraftUploads(coachId, draftId)` — `lib/uploads/list-draft-uploads.ts` (Storage `list` on prefix)

## RLS

Coach-scoped policies in the migration: read/write/delete only under `{auth.uid()}/**`.

## Lifecycle

- **Write:** `POST /api/coach/upload-context` (Phase 2)
- **List / read:** plan-chat tools in Phase 3 (`list_draft_files`, `read_draft_file`) — not browser-direct
- **Never** copied into Vercel Sandbox
- **Delete:** after plan-chat run or TTL janitor (TBD)

## Related code

| Module | Role |
| --- | --- |
| `lib/uploads/context-storage.ts` | save / load / delete |
| `lib/uploads/list-draft-uploads.ts` | list prefix for tools |
| `app/api/coach/upload-context/route.ts` | attach API |
