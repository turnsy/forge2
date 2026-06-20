import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRole = vi.fn();
const mockSaveChatSession = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock("@/lib/chat/session-storage", () => ({
  saveChatSession: (...args: unknown[]) => mockSaveChatSession(...args),
}));

import { saveSessionSnapshot } from "@/lib/chat/actions";

describe("saveSessionSnapshot", () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockSaveChatSession.mockReset();
    mockRequireRole.mockResolvedValue({ id: "coach-1" });
  });

  it("saves a snapshot for the authenticated coach", async () => {
    mockSaveChatSession.mockResolvedValue({ status: "saved" });
    const snapshot = {
      messages: [{ role: "user" as const, content: "Hello" }],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      contextFileIds: [],
    };

    const result = await saveSessionSnapshot("session-1", snapshot);

    expect(result).toEqual({ ok: true });
    expect(mockSaveChatSession).toHaveBeenCalledWith(
      "coach-1",
      "session-1",
      snapshot,
    );
  });

  it("returns an error when persistence fails", async () => {
    mockSaveChatSession.mockResolvedValue({
      status: "error",
      message: "db down",
    });

    const result = await saveSessionSnapshot("session-1", {
      messages: [{ role: "user", content: "Hello" }],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      contextFileIds: [],
    });

    expect(result).toEqual({ ok: false, message: "db down" });
  });
});
