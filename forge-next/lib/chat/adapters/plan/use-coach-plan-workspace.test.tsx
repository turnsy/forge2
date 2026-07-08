import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

const mockSearchParams = vi.fn(() => new URLSearchParams());
const mockPathname = vi.fn(() => "/coach");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
  usePathname: () => mockPathname(),
}));

const {
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
  mockSend,
  mockReset,
  mockStop,
  capturedEveAgentOptions,
  capturedOnPostResponse,
  agentSessionState,
  agentEventsState,
  agentDataState,
  agentStatusState,
} = vi.hoisted(() => ({
  saveSessionSnapshot: vi.fn(),
  generateSessionTitleFromPrompt: vi.fn(),
  mockSend: vi.fn(),
  mockReset: vi.fn(),
  mockStop: vi.fn(),
  capturedEveAgentOptions: {
    current: undefined as
      | {
          onEvent?: (event: { type: string }) => void;
          onFinish?: (snapshot: {
            session: {
              sessionId?: string;
              continuationToken?: string;
              streamIndex?: number;
            };
            events: unknown[];
          }) => Promise<void>;
        }
      | undefined,
  },
  capturedOnPostResponse: {
    current: undefined as
      | ((response: {
          sessionId: string;
          continuationToken?: string;
        }) => void)
      | undefined,
  },
  agentSessionState: {
    current: {
      sessionId: undefined as string | undefined,
      continuationToken: undefined as string | undefined,
      streamIndex: 0,
    },
  },
  agentEventsState: {
    current: [] as unknown[],
  },
  agentDataState: {
    current: {
      messages: [] as { role: "user" | "assistant"; content: string }[],
      currentArtifact: null as ReturnType<typeof createEmptyWorkoutPlan> | null,
      planId: null as string | null,
      artifactTitle: "",
      runStatus: null as string | null,
      streamingAssistantText: "",
      errors: [] as { message: string }[],
      phase: "idle" as const,
      warnings: [] as string[],
    },
  },
  agentStatusState: {
    current: "ready" as "ready" | "submitted" | "streaming" | "error",
  },
}));

vi.mock("@/lib/chat/actions", () => ({
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
}));

vi.mock("@/lib/chat/adapters/plan/forge-eve-client", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/chat/adapters/plan/forge-eve-client")
    >();
  return {
    ...actual,
    bindForgeEveSessionSend: vi.fn((session, onPostResponse) => {
      capturedOnPostResponse.current = onPostResponse;
      return session;
    }),
  };
});

vi.mock("eve/react", () => ({
  useEveAgent: (options?: {
    prepareSend?: (input: { message: string }) => {
      message: string;
      clientContext?: unknown;
    };
    onEvent?: (event: { type: string }) => void;
    onFinish?: (snapshot: {
      session: { sessionId?: string; continuationToken?: string; streamIndex?: number };
      events: unknown[];
    }) => Promise<void>;
  }) => {
    capturedEveAgentOptions.current = options;
    return {
      get data() {
        return agentDataState.current;
      },
      get status() {
        return agentStatusState.current;
      },
      error: null,
      get events() {
        return agentEventsState.current;
      },
      get session() {
        return agentSessionState.current;
      },
      send: async (input: { message: string }) => {
        const prepared = options?.prepareSend?.(input) ?? input;
        capturedOnPostResponse.current?.({
          sessionId: "eve-session",
          continuationToken: "token",
        });
        agentSessionState.current = {
          sessionId: "eve-session",
          continuationToken: "token",
          streamIndex: 0,
        };
        options?.onEvent?.({ type: "message.received" });
        agentEventsState.current = [{ type: "message.received" }];
        await mockSend(prepared);
      },
      reset: mockReset,
      stop: mockStop,
      onFinish: options?.onFinish,
    };
  },
}));

describe("useCoachPlanWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedEveAgentOptions.current = undefined;
    capturedOnPostResponse.current = undefined;
    agentSessionState.current = {
      sessionId: undefined,
      continuationToken: undefined,
      streamIndex: 0,
    };
    agentEventsState.current = [];
    agentDataState.current = {
      messages: [],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      runStatus: null,
      streamingAssistantText: "",
      errors: [],
      phase: "idle",
      warnings: [],
    };
    agentStatusState.current = "ready";
    mockSend.mockResolvedValue(undefined);
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

  it("persists and redirects after the first Eve event", async () => {
    const onThreadInitialized = vi.fn();
    const onSessionUrlNavigate = vi.fn();
    const plan = createEmptyWorkoutPlan();
    let resolveSend: (() => void) | undefined;

    mockSend.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useCoachPlanWorkspace({
        initialPlan: plan,
        planId: "plan-abc",
        onThreadInitialized,
        onSessionUrlNavigate,
      }),
    );

    let sendPromise: Promise<void> | undefined;
    act(() => {
      sendPromise = result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    await waitFor(() => {
      expect(saveSessionSnapshot).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: "Strength block",
          eve: expect.objectContaining({ sessionId: "eve-session" }),
          eveEvents: [{ type: "message.received" }],
        }),
      );
      expect(onThreadInitialized).toHaveBeenCalledWith({
        sessionId: expect.any(String),
        title: "Strength block",
      });
      expect(onSessionUrlNavigate).toHaveBeenCalledWith(expect.any(String));
    });

    await act(async () => {
      resolveSend?.();
      await sendPromise;
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Hello",
        clientContext: expect.objectContaining({
          clientArtifact: expect.objectContaining({
            plan,
            planId: "plan-abc",
          }),
        }),
      }),
    );
  });

  it("debounces mid-turn persistence after bootstrap", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useCoachPlanWorkspace());

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    saveSessionSnapshot.mockClear();

    await act(async () => {
      capturedEveAgentOptions.current?.onEvent?.({
        type: "message.delta",
      });
    });

    expect(saveSessionSnapshot).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(saveSessionSnapshot).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        eveEvents: [
          { type: "message.received" },
          { type: "message.delta" },
        ],
      }),
    );

    vi.useRealTimers();
  });

  it("sets initializing phase while the session title is generated", async () => {
    let resolveTitle: (value: string) => void = () => {};
    generateSessionTitleFromPrompt.mockReturnValue(
      new Promise((resolve) => {
        resolveTitle = resolve;
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
      resolveTitle("Strength block");
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
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Build a bench plan" }),
    );
  });

  it("persists a non-null title when onFinish runs after title generation", async () => {
    const sessionId = "session-title-test";
    const { result } = renderHook(() =>
      useCoachPlanWorkspace({
        initialSession: {
          id: sessionId,
          snapshot: {
            title: null,
            forgeSessionId: sessionId,
            eve: null,
          },
        },
      }),
    );

    await act(async () => {
      await result.current.sendMessage([
        { type: "text", value: "Build a bench plan" },
      ]);
    });

    await act(async () => {
      await capturedEveAgentOptions.current?.onFinish?.({
        session: {
          sessionId: "eve-session",
          continuationToken: "token",
          streamIndex: 1,
        },
        events: [{ type: "session.completed" }],
      });
    });

    expect(saveSessionSnapshot).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ title: "Strength block" }),
    );
  });

  it("stops the in-flight agent response", () => {
    const { result } = renderHook(() => useCoachPlanWorkspace());

    act(() => {
      result.current.stopResponse();
    });

    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("clears generating state when stop is clicked after the stream ends", () => {
    agentDataState.current = {
      messages: [{ role: "user", content: "Build a plan" }],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      runStatus: "generating",
      streamingAssistantText: "",
      errors: [],
      phase: "idle",
      warnings: [],
    };

    const { result } = renderHook(() => useCoachPlanWorkspace());

    expect(result.current.state.runStatus).toBe("generating");

    act(() => {
      result.current.stopResponse();
    });

    expect(mockStop).toHaveBeenCalledOnce();
    expect(result.current.state.runStatus).toBeNull();
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.errors).toEqual([]);
  });

  it("returns to idle while the Eve client is still winding down after stop", () => {
    agentDataState.current = {
      messages: [{ role: "user", content: "Build a plan" }],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      runStatus: "generating",
      streamingAssistantText: "Partial",
      errors: [],
      phase: "streaming",
      warnings: [],
    };
    agentStatusState.current = "streaming";

    const { result } = renderHook(() => useCoachPlanWorkspace());

    expect(result.current.state.phase).toBe("streaming");

    act(() => {
      result.current.stopResponse();
    });

    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.runStatus).toBe("done");
    expect(result.current.state.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "assistant", content: "Partial" },
    ]);
  });

  it("hides late abort failures after stop", () => {
    agentDataState.current = {
      messages: [{ role: "user", content: "Build a plan" }],
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
      runStatus: "generating",
      streamingAssistantText: "",
      errors: [],
      phase: "streaming",
      warnings: [],
    };
    agentStatusState.current = "submitted";

    const { result, rerender } = renderHook(() => useCoachPlanWorkspace());

    act(() => {
      result.current.stopResponse();
    });

    expect(result.current.state.errors).toEqual([]);

    agentDataState.current = {
      ...agentDataState.current,
      runStatus: "error",
      phase: "error",
      errors: [{ message: "fetch is aborted" }],
    };
    agentStatusState.current = "ready";

    rerender();

    expect(result.current.state.errors).toEqual([]);
    expect(result.current.state.phase).toBe("idle");
  });
});
