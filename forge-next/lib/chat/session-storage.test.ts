import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpsert = vi.fn();
const mockMaybeSingle = vi.fn();
const mockDelete = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockEqSecond = vi.fn();
const mockEqFirst = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      upsert: mockUpsert,
      select: mockSelect,
      delete: mockDelete,
    })),
  })),
}));

import {
  deleteChatSession,
  listRecentChatSessions,
  loadChatSession,
  renameChatSession,
  saveChatSession,
  saveSessionSnapshot,
} from "@/lib/chat/session-storage";

function createSnapshot() {
  return {
    title: "Bench Press Block",
    forgeSessionId: "session-1",
    eve: {
      sessionId: "eve-1",
      continuationToken: "token",
    },
  };
}

describe("saveChatSession", () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockMaybeSingle.mockReset();
    mockEqSecond.mockReset();
    mockEqFirst.mockReset();
    mockSelect.mockReset();
    mockUpsert.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEqSecond.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockEqFirst.mockReturnValue({ eq: mockEqSecond });
    mockSelect.mockReturnValue({ eq: mockEqFirst });
  });

  it("upserts by session id and coach id", async () => {
    const snapshot = createSnapshot();

    const result = await saveChatSession("coach-1", "session-1", snapshot);

    expect(result).toEqual({ status: "saved", title: "Bench Press Block" });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: "session-1",
        coach_id: "coach-1",
        snapshot,
      },
      { onConflict: "id" },
    );
  });

  it("returns an error when upsert fails", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "db down" } });

    const result = await saveChatSession(
      "coach-1",
      "session-1",
      createSnapshot(),
    );

    expect(result).toEqual({ status: "error", message: "db down" });
  });
});

describe("saveSessionSnapshot", () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("returns an ok result with the saved title", async () => {
    const snapshot = createSnapshot();

    const result = await saveSessionSnapshot("coach-1", "session-1", snapshot);

    expect(result).toEqual({ ok: true, title: "Bench Press Block" });
  });

  it("returns an error when persistence fails", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "db down" } });

    const result = await saveSessionSnapshot(
      "coach-1",
      "session-1",
      createSnapshot(),
    );

    expect(result).toEqual({ ok: false, message: "db down" });
  });
});

describe("loadChatSession", () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset();
    mockEqSecond.mockReset();
    mockEqFirst.mockReset();
    mockSelect.mockReset();

    mockEqSecond.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockEqFirst.mockReturnValue({ eq: mockEqSecond });
    mockSelect.mockReturnValue({ eq: mockEqFirst });
  });

  it("returns a found session", async () => {
    const snapshot = createSnapshot();
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "session-1",
        snapshot,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-02T00:00:00.000Z",
      },
      error: null,
    });

    const result = await loadChatSession("coach-1", "session-1");

    expect(result).toEqual({
      status: "found",
      session: {
        id: "session-1",
        snapshot,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
      },
    });
  });

  it("returns not_found when no row exists", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await loadChatSession("coach-1", "missing");

    expect(result).toEqual({ status: "not_found" });
  });
});

describe("listRecentChatSessions", () => {
  beforeEach(() => {
    mockLimit.mockReset();
    mockOrder.mockReset();
    mockEqFirst.mockReset();
    mockSelect.mockReset();

    mockLimit.mockResolvedValue({
      data: [
        {
          id: "session-1",
          snapshot: createSnapshot(),
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-02T00:00:00.000Z",
        },
      ],
      error: null,
    });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockEqFirst.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEqFirst });
  });

  it("maps recent sessions with titles", async () => {
    const result = await listRecentChatSessions("coach-1", 5);

    expect(result.sessions).toEqual([
      {
        id: "session-1",
        title: "Bench Press Block",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
      },
    ]);
    expect(mockOrder).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(5);
  });
});

describe("renameChatSession", () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset();
    mockEqSecond.mockReset();
    mockEqFirst.mockReset();
    mockSelect.mockReset();
    mockUpsert.mockReset();

    mockEqSecond.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockEqFirst.mockReturnValue({ eq: mockEqSecond });
    mockSelect.mockReturnValue({ eq: mockEqFirst });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("updates the snapshot title", async () => {
    const snapshot = createSnapshot();
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "session-1",
        snapshot,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-02T00:00:00.000Z",
      },
      error: null,
    });

    const result = await renameChatSession("coach-1", "session-1", "New title");

    expect(result).toEqual({ ok: true });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: "session-1",
        coach_id: "coach-1",
        snapshot: { ...snapshot, title: "New title" },
      },
      { onConflict: "id" },
    );
  });
});

describe("deleteChatSession", () => {
  beforeEach(() => {
    mockDelete.mockReset();
    mockEqSecond.mockReset();
    mockEqFirst.mockReset();
    mockDelete.mockReturnValue({ eq: mockEqFirst });
    mockEqFirst.mockReturnValue({ eq: mockEqSecond });
    mockEqSecond.mockResolvedValue({ error: null });
  });

  it("deletes the session for the coach", async () => {
    const result = await deleteChatSession("coach-1", "session-1");

    expect(result).toEqual({ ok: true });
    expect(mockEqFirst).toHaveBeenCalledWith("id", "session-1");
    expect(mockEqSecond).toHaveBeenCalledWith("coach_id", "coach-1");
  });
});
