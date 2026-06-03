import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { handleUploadContextFormData } from "@/lib/uploads/upload-context-handler";

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) {
    return auth.response;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "PARSE_FAILED", message: "Invalid multipart body." },
      { status: 400 },
    );
  }

  const result = await handleUploadContextFormData(auth.user.id, formData);

  if (!result.ok) {
    const status =
      result.error === "TOO_MANY_FILES" || result.error === "FILE_TOO_LARGE"
        ? 413
        : result.error === "UNSUPPORTED_TYPE"
          ? 415
          : result.error === "STORAGE_FAILED"
            ? 503
            : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
