import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRole = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

const mockListRecentChatSessions = vi.fn();
const mockRenameChatSession = vi.fn();
const mockDeleteChatSession = vi.fn();

vi.mock("@/lib/chat/session-storage", () => ({
  listRecentChatSessions: (...args: unknown[]) =>
    mockListRecentChatSessions(...args),
  renameChatSession: (...args: unknown[]) => mockRenameChatSession(...args),
  deleteChatSession: (...args: unknown[]) => mockDeleteChatSession(...args),
  saveSessionSnapshot: vi.fn(),
}));

import {
  deleteTaskSession,
  listTaskSessions,
  renameTaskSession,
} from "@/lib/chat/actions";

describe("chat actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({ id: "coach-1", role: "coach" });
  });

  it("lists task sessions for the coach", async () => {
    mockListRecentChatSessions.mockResolvedValue({
      sessions: [
        {
          id: "session-1",
          title: "Bench block",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-02T00:00:00.000Z",
          preview: "Build a plan",
        },
      ],
    });

    const result = await listTaskSessions();

    expect(mockRequireRole).toHaveBeenCalledWith("coach");
    expect(result).toEqual({
      ok: true,
      sessions: [
        {
          id: "session-1",
          title: "Bench block",
          updatedAt: "2026-06-02T00:00:00.000Z",
        },
      ],
    });
  });

  it("returns an error when listing fails", async () => {
    mockListRecentChatSessions.mockRejectedValue(new Error("db down"));

    const result = await listTaskSessions();

    expect(result).toEqual({
      ok: false,
      message: "db down",
    });
  });

  it("renames a task session", async () => {
    mockRenameChatSession.mockResolvedValue({ ok: true });

    const result = await renameTaskSession("session-1", "New title");

    expect(mockRenameChatSession).toHaveBeenCalledWith(
      "coach-1",
      "session-1",
      "New title",
    );
    expect(result).toEqual({ ok: true });
  });

  it("deletes a task session", async () => {
    mockDeleteChatSession.mockResolvedValue({ ok: true });

    const result = await deleteTaskSession("session-1");

    expect(mockDeleteChatSession).toHaveBeenCalledWith("coach-1", "session-1");
    expect(result).toEqual({ ok: true });
  });
});
