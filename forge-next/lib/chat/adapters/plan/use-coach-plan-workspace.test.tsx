import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

const {
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
  initCoachThread,
  persistCoachSessionEve,
  mockSend,
  mockReset,
} = vi.hoisted(() => ({
  saveSessionSnapshot: vi.fn(),
  generateSessionTitleFromPrompt: vi.fn(),
  initCoachThread: vi.fn(),
  persistCoachSessionEve: vi.fn(),
  mockSend: vi.fn(),
  mockReset: vi.fn(),
}));

vi.mock("@/lib/chat/actions", () => ({
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
  initCoachThread,
  persistCoachSessionEve,
}));

vi.mock("eve/react", () => ({
  useEveAgent: (options?: {
    onFinish?: (snapshot: {
      session: { sessionId?: string; continuationToken?: string };
    }) => Promise<void>;
  }) => ({
    data: {
      messages: [],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      runStatus: null,
      streamingAssistantText: "",
      errors: [],
      phase: "idle",
      warnings: [],
    },
    status: "ready",
    error: null,
    events: [],
    session: { sessionId: undefined, continuationToken: undefined, streamIndex: 0 },
    send: mockSend,
    reset: mockReset,
    stop: vi.fn(),
    onFinish: options?.onFinish,
  }),
}));

describe("useCoachPlanWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue(undefined);
    initCoachThread.mockResolvedValue({ ok: true });
    persistCoachSessionEve.mockResolvedValue({ ok: true });
    saveSessionSnapshot.mockResolvedValue({
      ok: true,
      title: "Strength block",
    });
    generateSessionTitleFromPrompt.mockResolvedValue("Strength block");
  });

  it("initializes with a draft plan when initialPlan is provided without planId", () => {
    const draftPlan = createEmptyWorkoutPlan();

    const { result } = renderHook(() =>
      useCoachPlanWorkspace({ initialPlan: draftPlan }),
    );

    expect(result.current.state.hasStarted).toBe(true);
    expect(result.current.state.currentArtifact).toEqual(draftPlan);
    expect(result.current.state.planId).toBeNull();
    expect(result.current.state.artifactTitle).toBe("New Plan");
  });

  it("initializes the forge thread before the first send", async () => {
    const onThreadInitialized = vi.fn();
    const { result } = renderHook(() =>
      useCoachPlanWorkspace({ onThreadInitialized }),
    );

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    expect(initCoachThread).toHaveBeenCalledWith(
      expect.any(String),
      "Strength block",
    );
    expect(onThreadInitialized).toHaveBeenCalledWith({
      sessionId: expect.any(String),
      title: "Strength block",
    });
    expect(mockSend).toHaveBeenCalledWith({ message: "Hello" });
  });

  it("sets initializing phase while the forge thread is created", async () => {
    let resolveInit: (value: { ok: boolean }) => void = () => {};
    initCoachThread.mockReturnValue(
      new Promise((resolve) => {
        resolveInit = resolve;
      }),
    );

    const { result } = renderHook(() => useCoachPlanWorkspace());

    let sendPromise: Promise<void> | undefined;
    act(() => {
      sendPromise = result.current.sendMessage([
        { type: "text", value: "Hello" },
      ]);
    });

    await waitFor(() => {
      expect(result.current.state.phase).toBe("initializing");
    });

    await act(async () => {
      resolveInit({ ok: true });
      await sendPromise;
    });

    expect(result.current.state.phase).toBe("idle");
  });

  it("starts title generation on the first user message before sending", async () => {
    const { result } = renderHook(() => useCoachPlanWorkspace());

    await act(async () => {
      await result.current.sendMessage([
        { type: "text", value: "Build a bench plan" },
      ]);
    });

    expect(generateSessionTitleFromPrompt).toHaveBeenCalledWith(
      "Build a bench plan",
    );
    expect(mockSend).toHaveBeenCalledWith({ message: "Build a bench plan" });
  });
});
