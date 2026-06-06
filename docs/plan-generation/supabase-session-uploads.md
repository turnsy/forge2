# Supabase Storage — ephemeral session uploads

Coach chat sessions store **normalized upload text** in Supabase Storage. Objects are ephemeral (deleted after a run or by TTL janitor).

## Bucket

| Setting | Value |
| --- | --- |
| Bucket name | `session-uploads` |
| Visibility | **Private** (server reads via authenticated Supabase client + RLS) |
| Max object size | Enforced at API layer per [overview.md](./overview.md) |

Create on **hosted** Supabase:

```bash
# 1. Bucket metadata (required — db push does not create buckets on remote)
npx supabase seed buckets --linked

# 2. RLS policies (after pulling branch with the migration below)
npx supabase db push
```

Declared in `supabase/config.toml` (`[storage.buckets."session-uploads"]`). Policies in `supabase/migrations/20260606120000_session_uploads_bucket.sql` (replaces legacy `draft-uploads` from `20260602120000_draft_uploads_storage.sql`).

## Object key layout

```text
session-uploads/{coachId}/{sessionId}/{slug}.txt
```

- `coachId` — authenticated coach user id
- `sessionId` — client workspace / conversation id (**required** on upload + plan-chat APIs)
- `slug` — see below

### Slugs

| Source | Example slug |
| --- | --- |
| CSV / PDF | `my-plan` from `My Plan.csv` |
| XLSX (per sheet) | `my-workbook__summary`, `my-workbook__volume` |

One physical `.xlsx` with three sheets → **three** objects under the same `{sessionId}`.

Helpers:

- `sessionUploadObjectPath()`, `sessionUploadPrefix()` — `lib/uploads/storage-paths.ts`
- `uploadFileSlug()` — `lib/uploads/file-utils.ts` (file/sheet slug only)
- `listSessionUploads(coachId, sessionId)` — `lib/uploads/list-session-uploads.ts`

## RLS

Coach-scoped policies in the migration: read/write/delete only under `{auth.uid()}/**`.

## Lifecycle

- **Write:** `POST /api/coach/upload-context` — multipart `sessionId` + files
- **List / read:** plan-chat tools (`list_session_files`, `read_session_file`)
- **Never** copied into Vercel Sandbox
- **Delete:** after plan-chat run or TTL janitor (TBD)

## Related code

| Module | Role |
| --- | --- |
| `lib/uploads/context-storage.ts` | save / load / delete |
| `lib/uploads/list-session-uploads.ts` | list prefix for tools |
| `app/api/coach/upload-context/route.ts` | attach API |
| `lib/chat/adapters/plan/` | plan-mode client adapter |

## Troubleshooting

### `db push` says "Remote database is up to date" but no `session-uploads` bucket

1. **Check your branch.** On `main`, only `20260602120000_draft_uploads_storage.sql` exists (creates `draft-uploads`). The `session-uploads` migration (`20260606120000_…`) is on the Phase 6 PR branch until merged. If local migrations match remote, `db push` correctly reports up to date.

2. **Compare migration history:**
   ```bash
   npx supabase migration list
   ```
   Remote must show `20260606120000` as applied for the RLS migration to have run.

3. **Create the bucket explicitly** (Supabase does not sync bucket rows via `db push` on hosted projects):
   ```bash
   npx supabase seed buckets --linked
   ```

4. **Then apply RLS** (once the `20260606120000` migration file is present locally):
   ```bash
   npx supabase db push
   ```

### Renamed migration not re-running

Supabase tracks migrations by **version timestamp**, not filename. Renaming `20260602120000_draft_uploads_storage.sql` in place does **not** re-run on databases that already applied it — that is why `20260606120000_session_uploads_bucket.sql` was added as a new version.
