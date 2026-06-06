import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiRole = vi.fn();
const mockHandleUploadContextFormData = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/uploads/upload-context-handler", () => ({
  handleUploadContextFormData: (...args: unknown[]) =>
    mockHandleUploadContextFormData(...args),
}));

import { POST } from "@/app/api/coach/upload-context/route";

describe("POST /api/coach/upload-context", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockHandleUploadContextFormData.mockReset();
  });

  it("returns auth failure from requireApiRole", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/coach/upload-context", {
        method: "POST",
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns context file ids on success", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });
    mockHandleUploadContextFormData.mockResolvedValue({
      ok: true,
      contextFileIds: ["coach-1/draft-1/plan.txt"],
    });

    const form = new FormData();
    form.set("sessionId", "session-1");
    form.append("files", new File(["a,b"], "plan.csv", { type: "text/csv" }));

    const response = await POST(
      new Request("http://localhost/api/coach/upload-context", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      contextFileIds: ["coach-1/draft-1/plan.txt"],
    });
  });
});
