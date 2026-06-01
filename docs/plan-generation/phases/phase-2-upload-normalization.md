# Phase 2 — Upload normalization

**Goal:** Server accepts multiple coach uploads, enforces caps, and produces compact text context for the LLM and sandbox (not raw binary in prompts).

**Depends on:** Phase 1 (deps + limits)

**Blocks:** Phase 3 (chat API sends normalized context)

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
- [ ] Unit tests: CSV sample, multi-sheet XLSX, PDF fixture (small), over-limit rejection, unsupported extension
- [ ] Map errors to stable codes: `FILE_TOO_LARGE`, `TOO_MANY_FILES`, `UNSUPPORTED_TYPE`, `PARSE_FAILED`, `XLSX_NEEDS_SHEET`

---

## Developer actions

- [ ] Review cap values in [overview.md](../overview.md); adjust if product requires stricter limits
- [ ] Provide 2–3 real anonymized sample files for manual QA (CSV export from Sheets, small PDF, multi-sheet XLSX)
- [ ] Confirm serverless function memory/timeout on Vercel is sufficient for PDF parse (upgrade or cap PDF size if builds fail)

---

## Done criteria

- [ ] Given fixtures, `normalizeMessageUploads()` returns expected text shapes
- [ ] 6th file or oversize file fails with clear error code
- [ ] Multi-sheet XLSX without sheet hint returns clarification payload (not thrown exception)
- [ ] No upload bytes stored in Supabase in v1

---

## Output shape (for Phase 3)

```ts
type NormalizedUpload =
  | { kind: "csv"; filename: string; content: string; truncated?: boolean }
  | { kind: "pdf"; filename: string; content: string; pageCount: number }
  | { kind: "xlsx"; filename: string; sheetName: string; content: string; allSheetNames: string[] };

type NormalizeResult =
  | { ok: true; uploads: NormalizedUpload[]; combinedContext: string }
  | { ok: false; error: UploadErrorCode; message: string }
  | { ok: false; needsSheetClarification: true; sheets: string[]; filename: string };
```

`combinedContext` is a single string block appended to the system/user prompt (filename headers, not JSON wrapping of tables).
