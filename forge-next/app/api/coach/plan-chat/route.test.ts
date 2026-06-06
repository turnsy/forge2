import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiRole = vi.fn();
const mockRunPlanChat = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/ai/plan-chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/plan-chat")>();
  return {
    ...actual,
    runPlanChat: (...args: unknown[]) => mockRunPlanChat(...args),
  };
});

import { POST } from "@/app/api/coach/plan-chat/route";

describe("POST /api/coach/plan-chat", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockRunPlanChat.mockReset();
    mockRunPlanChat.mockImplementation(async ({ emit }) => {
      emit({ type: "runStatus", status: "done" });
    });
  });

  it("returns 403 when athlete role", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/coach/plan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "s-1", prompt: "hi" }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/coach/plan-chat", {
        method: "POST",
        body: JSON.stringify({ sessionId: "s-1", prompt: "hi" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when sessionId is missing", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });

    const response = await POST(
      new Request("http://localhost/api/coach/plan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Build a plan" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid body", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });

    const response = await POST(
      new Request("http://localhost/api/coach/plan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "s-1", prompt: "" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("streams SSE events on success", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });

    const response = await POST(
      new Request("http://localhost/api/coach/plan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "s-1", prompt: "Build a plan" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain('"type":"runStatus"');
    expect(mockRunPlanChat).toHaveBeenCalled();
  });
});
