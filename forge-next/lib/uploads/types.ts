export type UploadErrorCode =
  | "FILE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "UNSUPPORTED_TYPE"
  | "PARSE_FAILED"
  | "XLSX_NEEDS_SHEET"
  | "STORAGE_FAILED";

export type UploadWarning = {
  code: "CSV_TRUNCATED" | "PDF_EMPTY_PAGE";
  message: string;
};

export type NormalizedUpload =
  | { kind: "csv"; filename: string; content: string; truncated?: boolean }
  | {
      kind: "pdf";
      filename: string;
      content: string;
      pageCount: number;
    }
  | {
      kind: "xlsx";
      filename: string;
      sheetName: string;
      content: string;
      allSheetNames: string[];
    };

export type ParseUploadSuccess = {
  ok: true;
  upload: NormalizedUpload;
  warnings?: UploadWarning[];
};

export type ParseUploadFailure = {
  ok: false;
  code: UploadErrorCode;
  message: string;
};

export type ParseUploadResult = ParseUploadSuccess | ParseUploadFailure;

export type UploadContextSuccess = {
  ok: true;
  contextFileIds: string[];
  warnings?: UploadWarning[];
};

export type UploadContextError = {
  ok: false;
  error: UploadErrorCode;
  message: string;
};

export type UploadContextSheetClarification = {
  ok: false;
  needsSheetClarification: true;
  sheets: string[];
  filename: string;
};

export type UploadContextResult =
  | UploadContextSuccess
  | UploadContextError
  | UploadContextSheetClarification;

export type MessageUploadFile = {
  filename: string;
  buffer: Buffer;
  mimeType?: string;
};
