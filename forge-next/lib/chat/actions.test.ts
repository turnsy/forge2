import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRole = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

const mockListRecentChatSessions = vi.fn();
const mockRenameChatSession = vi.fn();
const mockDeleteChatSession = vi.fn();
const mockListSessionUploads = vi.fn();
const mockDeleteUploadContext = vi.fn();

vi.mock("@/lib/chat/session-storage", () => ({
  listRecentChatSessions: (...args: unknown[]) =>
    mockListRecentChatSessions(...args),
  renameChatSession: (...args: unknown[]) => mockRenameChatSession(...args),
  deleteChatSession: (...args: unknown[]) => mockDeleteChatSession(...args),
  saveSessionSnapshot: vi.fn(),
}));

vi.mock("@/lib/uploads/list-session-uploads", () => ({
  listSessionUploads: (...args: unknown[]) => mockListSessionUploads(...args),
}));

vi.mock("@/lib/uploads/context-storage", () => ({
  deleteUploadContext: (...args: unknown[]) => mockDeleteUploadContext(...args),
}));

import {
  deleteTaskSession,
  listSessionAttachments,
  listTaskSessions,
  removeSessionAttachments,
  renameTaskSession,
} from "@/lib/chat/actions";

describe("chat actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({ id: "coach-1", role: "coach" });
    mockDeleteUploadContext.mockResolvedValue({ ok: true });
  });

  it("lists task sessions for the coach", async () => {
    mockListRecentChatSessions.mockResolvedValue({
      sessions: [
        {
          id: "session-1",
          title: "Bench block",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-02T00:00:00.000Z",
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

  it("lists session attachments from storage", async () => {
    mockListSessionUploads.mockResolvedValue([
      {
        path: "coach-1/session-1/my-plan.txt",
        name: "my-plan.txt",
        sizeBytes: 12,
      },
    ]);

    const result = await listSessionAttachments("session-1");

    expect(mockListSessionUploads).toHaveBeenCalledWith("coach-1", "session-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0]).toMatchObject({
        status: "uploaded",
        displayLabel: "my plan",
        contextFileIds: ["coach-1/session-1/my-plan.txt"],
      });
    }
  });

  it("removes session attachments and returns the updated storage view", async () => {
    mockDeleteUploadContext.mockResolvedValue({ ok: true });
    mockListSessionUploads.mockResolvedValue([]);

    const result = await removeSessionAttachments("session-1", [
      "coach-1/session-1/my-plan.txt",
    ]);

    expect(mockDeleteUploadContext).toHaveBeenCalledWith(
      ["coach-1/session-1/my-plan.txt"],
      "coach-1",
    );
    expect(mockListSessionUploads).toHaveBeenCalledWith("coach-1", "session-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attachments).toEqual([]);
    }
  });
});
