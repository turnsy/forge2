import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpsert = vi.fn();
const mockMaybeSingle = vi.fn();
const mockDelete = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockEqSecond = vi.fn();
const mockEqFirst = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/chat/session-title/generate", () => ({
  SESSION_FALLBACK_TITLE: "Untitled conversation",
  shouldGenerateSessionTitle: vi.fn(
    (
      _snapshot: { messages: { role: string; content: string }[] },
      options?: { generateTitle?: boolean },
    ) => options?.generateTitle === true,
  ),
  generateSessionTitle: vi.fn(async () => "Bench Press Block"),
}));

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
  extractSessionPreview,
  listRecentChatSessions,
  loadChatSession,
  renameChatSession,
  saveChatSession,
  saveSessionSnapshot,
} from "@/lib/chat/session-storage";

function createSnapshot() {
  return {
    title: null,
    messages: [{ role: "user" as const, content: "Build a plan" }],
    currentArtifact: null,
    planId: "plan-1",
    artifactTitle: "Strength Block",
    contextFileIds: ["ctx-1"],
  };
}

describe("extractSessionPreview", () => {
  it("returns the first message content", () => {
    expect(
      extractSessionPreview({
        title: null,
        messages: [{ role: "user", content: "Hello coach" }],
        currentArtifact: null,
        planId: null,
        artifactTitle: "",
        contextFileIds: [],
      }),
    ).toBe("Hello coach");
  });

  it("truncates long previews", () => {
    const content = "a".repeat(150);
    const preview = extractSessionPreview({
      title: null,
      messages: [{ role: "user", content }],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      contextFileIds: [],
    });

    expect(preview).toHaveLength(121);
    expect(preview.endsWith("…")).toBe(true);
  });
});

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

    const result = await saveChatSession("coach-1", "session-1", snapshot, {
      generateTitle: true,
    });

    expect(result).toEqual({ status: "saved", title: "Bench Press Block" });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: "session-1",
        coach_id: "coach-1",
        snapshot: { ...snapshot, title: "Bench Press Block" },
      },
      { onConflict: "id" },
    );
  });

  it("uses a client-provided title without generating a new one", async () => {
    const snapshot = { ...createSnapshot(), title: "Existing title" };

    const result = await saveChatSession("coach-1", "session-1", snapshot, {
      generateTitle: true,
    });

    expect(result).toEqual({ status: "saved", title: "Existing title" });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: "session-1",
        coach_id: "coach-1",
        snapshot: { ...snapshot, title: "Existing title" },
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

  it("generates a title by default when the snapshot has none", async () => {
    const snapshot = createSnapshot();

    const result = await saveChatSession("coach-1", "session-1", snapshot);

    expect(result).toEqual({ status: "saved", title: "Bench Press Block" });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: "session-1",
        coach_id: "coach-1",
        snapshot: { ...snapshot, title: "Bench Press Block" },
      },
      { onConflict: "id" },
    );
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

  it("skips title generation when the snapshot already has a title", async () => {
    const snapshot = { ...createSnapshot(), title: "Existing title" };

    const result = await saveSessionSnapshot("coach-1", "session-1", snapshot);

    expect(result).toEqual({ ok: true, title: "Existing title" });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: "session-1",
        coach_id: "coach-1",
        snapshot: { ...snapshot, title: "Existing title" },
      },
      { onConflict: "id" },
    );
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

  it("maps recent sessions with previews", async () => {
    const result = await listRecentChatSessions("coach-1", 5);

    expect(result.sessions).toEqual([
      {
        id: "session-1",
        title: "Untitled conversation",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
        preview: "Build a plan",
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
