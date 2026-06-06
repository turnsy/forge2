# Phase 2 — Upload normalization

**Status:** ✅ Done (revision: all XLSX sheets → separate Storage objects)

**Goal:** Server accepts multiple coach uploads, enforces caps, normalizes to compact text, stores in **Supabase Storage** under `{coachId}/{sessionId}/`, and returns ids for plan-chat. Normalized text is for the **LLM prompt only** — never copied into the sandbox.

**Depends on:** Phase 1 (deps + limits)

**Blocks:** Phase 3 (plan-chat lists/reads draft files)

---

## Agent actions

- [x] Implement `lib/uploads/parse-upload.ts` (CSV, PDF, XLSX)
- [x] **CSV:** keep as CSV string; optional row truncation with footer
- [x] **PDF:** extract text with `## Page N` sections (`pdf-worker.ts` for Next.js)
- [x] **XLSX:** export **every sheet** as CSV-like text (one Storage object per sheet)
- [x] Object naming: `{workbook-stem}__{sheet-slug}.txt` (see `draftUploadSlug()`)
- [x] Implement `lib/uploads/normalize-message-uploads.ts` — batch upload, no upload-time sheet gate
- [x] Implement `lib/uploads/context-storage.ts` — write/read/delete by slug
- [x] Implement `lib/uploads/list-session-uploads.ts` — `storage.list` under session prefix (for Phase 3 tools)
- [x] Add `POST /api/coach/upload-context` with coach auth
- [x] Unit tests: CSV, multi-sheet XLSX → multiple ids, limits, list helper
- [x] Error codes: `FILE_TOO_LARGE`, `TOO_MANY_FILES`, `UNSUPPORTED_TYPE`, `PARSE_FAILED`, `STORAGE_FAILED`

**Removed in revision (do not reintroduce on upload):**

- `needsSheetClarification` / 422 on upload
- `select-xlsx-sheets` on the upload path (module kept for optional prompt matching later)
- `XLSX_NEEDS_SHEET` error code

---

## Developer actions

- [ ] Review cap values in [overview.md](../overview.md)
- [ ] Apply `supabase/migrations/20260606120000_session_uploads_bucket.sql` on hosted Supabase (`supabase db push`)
- [ ] Manual QA: CSV, PDF, multi-sheet XLSX → multiple `contextFileIds` under one `sessionId`

---

## Done criteria

- [x] `normalizeMessageUploads()` returns one id per normalized sheet/file
- [x] Multi-sheet XLSX **succeeds** upload (no clarification error)
- [x] 6th file or oversize file fails with clear error code
- [x] Normalized text in Storage only — not `plans` / `plan_versions`
- [x] No upload files in Vercel Sandbox
- [x] `listSessionUploads(coachId, sessionId)` returns object names under the session prefix

---

## Storage layout

```text
session-uploads/{coachId}/{sessionId}/
  my-workbook__summary.txt
  my-workbook__volume.txt
  program-notes.pdf.txt   # slug from source filename
  plan.csv.txt
```

`contextFileId` = full object path (e.g. `coach-uuid/draft-uuid/my-workbook__summary.txt`).

---

## API contract

### `POST /api/coach/upload-context`

Multipart: `sessionId` (required), `files` / `files[]`.

**Success:**

```ts
{ ok: true; contextFileIds: string[]; warnings?: UploadWarning[] }
```

- One uploaded `.xlsx` with three sheets → **three** ids.
- Attach always succeeds when caps and parse succeed; sheet choice is **not** decided here.

**Errors:** `FILE_TOO_LARGE`, `TOO_MANY_FILES`, `UNSUPPORTED_TYPE`, `PARSE_FAILED`, `STORAGE_FAILED`.

Phase 3 uses `sessionId` + tools to list/read objects; see [phase-3-chat-api.md](./phase-3-chat-api.md).
