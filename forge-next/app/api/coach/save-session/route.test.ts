import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiRole = vi.fn();
const mockSaveChatSession = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/chat/session-storage", () => ({
  saveChatSession: (...args: unknown[]) => mockSaveChatSession(...args),
}));

import { POST } from "@/app/api/coach/save-session/route";

describe("POST /api/coach/save-session", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockSaveChatSession.mockReset();
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1" },
    });
    mockSaveChatSession.mockResolvedValue({ status: "saved", title: null });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireApiRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/coach/save-session", {
        method: "POST",
        body: JSON.stringify({ sessionId: "s-1", snapshot: { messages: [] } }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("saves a snapshot for the authenticated coach", async () => {
    const snapshot = {
      title: null,
      messages: [{ role: "user", content: "Hello" }],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      contextFileIds: [],
    };

    const response = await POST(
      new Request("http://localhost/api/coach/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "session-1", snapshot }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mockSaveChatSession).toHaveBeenCalledWith(
      "coach-1",
      "session-1",
      snapshot,
      { generateTitle: false },
    );
  });

  it("skips persistence for empty message sessions", async () => {
    const response = await POST(
      new Request("http://localhost/api/coach/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-1",
          snapshot: {
            title: null,
            messages: [],
            currentArtifact: null,
            planId: null,
            artifactTitle: "",
            contextFileIds: [],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockSaveChatSession).not.toHaveBeenCalled();
  });
});
