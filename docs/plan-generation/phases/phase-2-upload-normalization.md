# Phase 2 — Upload normalization

**Goal:** Server accepts multiple coach uploads, enforces caps, normalizes to compact text, stores in **Supabase Storage**, and returns ids for plan-chat. Normalized text is for the **LLM prompt only** — never copied into the sandbox.

**Depends on:** Phase 1 (deps + limits)

**Blocks:** Phase 3 (plan-chat loads context by id)

---

## Agent actions

- [ ] Implement `lib/uploads/parse-upload.ts`:
  - Accept `File` / `Buffer` + mime/extension
  - Return discriminated union: `{ kind: 'csv' | 'pdf' | 'xlsx', name, text, meta }` or `{ ok: false, code, message }`
- [ ] **CSV:** keep as CSV string; optional row/sample truncation with footer noting truncation
- [ ] **PDF:** extract text; chunk with simple headings (`## Page N` or detected headings); Markdown-friendly plain text
- [ ] **XLSX:** list sheet names in `meta.sheets`; export selected sheet(s) as CSV-like text
- [ ] Implement `lib/uploads/select-xlsx-sheets.ts`:
  - If one sheet → use it
  - If user named sheet in prompt (fuzzy match on sheet names) → use match
  - If multiple sheets and no match → return `{ needsClarification: true, sheets: string[] }` (no sandbox yet)
- [ ] Implement `lib/uploads/normalize-message-uploads.ts` for batch of files + prompt text
- [ ] Implement `lib/uploads/context-storage.ts`:
  - Write normalized text to Supabase Storage (`draft-uploads/{coachId}/{draftId}/{slug}.txt`)
  - Return stable `contextFileId` per file
  - TTL / delete after plan-chat run completes (or 24h janitor)
- [ ] Add `POST /api/coach/upload-context` with `requireRole('coach')`
- [ ] Unit tests: CSV sample, multi-sheet XLSX, PDF fixture (small), over-limit rejection, unsupported extension
- [ ] Map errors to stable codes: `FILE_TOO_LARGE`, `TOO_MANY_FILES`, `UNSUPPORTED_TYPE`, `PARSE_FAILED`, `XLSX_NEEDS_SHEET`

---

## Developer actions

- [ ] Review cap values in [overview.md](../overview.md); adjust if product requires stricter limits
- [ ] Create Supabase Storage bucket (or path policy) for ephemeral `draft-uploads/` — RLS scoped to coach
- [ ] Provide 2–3 real anonymized sample files for manual QA (CSV export from Sheets, small PDF, multi-sheet XLSX)
- [ ] Confirm serverless function memory/timeout on Vercel is sufficient for PDF parse (upgrade or cap PDF size if builds fail)

---

## Done criteria

- [ ] Given fixtures, `normalizeMessageUploads()` returns expected text shapes
- [ ] 6th file or oversize file fails with clear error code
- [ ] Multi-sheet XLSX without sheet hint returns clarification payload (not thrown exception)
- [ ] Normalized text persisted to Storage; **not** written to `plans` / `plan_versions`
- [ ] No normalized upload files mounted or copied into Vercel Sandbox

---

## Output shape (for Phase 3)

```ts
type NormalizedUpload =
  | { kind: "csv"; filename: string; content: string; truncated?: boolean }
  | { kind: "pdf"; filename: string; content: string; pageCount: number }
  | { kind: "xlsx"; filename: string; sheetName: string; content: string; allSheetNames: string[] };

type UploadContextResult =
  | { ok: true; contextFileIds: string[]; warnings?: UploadWarning[] }
  | { ok: false; error: UploadErrorCode; message: string }
  | { ok: false; needsSheetClarification: true; sheets: string[]; filename: string };
```

Phase 3 loads text by `contextFileId` and builds a single prompt appendix (filename headers, plain text — not JSON-wrapped tables).
