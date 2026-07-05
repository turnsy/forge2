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
  capturedEveAgentOptions,
  agentSessionState,
  agentEventsState,
} = vi.hoisted(() => ({
  saveSessionSnapshot: vi.fn(),
  generateSessionTitleFromPrompt: vi.fn(),
  mockSend: vi.fn(),
  mockReset: vi.fn(),
  capturedEveAgentOptions: {
    current: undefined as
      | {
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
}));

vi.mock("@/lib/chat/actions", () => ({
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
}));

vi.mock("eve/react", () => ({
  useEveAgent: (options?: {
    prepareSend?: (input: { message: string }) => {
      message: string;
      clientContext?: unknown;
    };
    onFinish?: (snapshot: {
      session: { sessionId?: string; continuationToken?: string; streamIndex?: number };
      events: unknown[];
    }) => Promise<void>;
  }) => {
    capturedEveAgentOptions.current = options;
    return {
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
      get events() {
        return agentEventsState.current;
      },
      get session() {
        return agentSessionState.current;
      },
      send: async (input: { message: string }) => {
        const prepared = options?.prepareSend?.(input) ?? input;
        agentSessionState.current = {
          sessionId: "eve-session",
          continuationToken: "token",
          streamIndex: 0,
        };
        agentEventsState.current = [{ type: "message.received" }];
        await mockSend(prepared);
      },
      reset: mockReset,
      stop: vi.fn(),
      onFinish: options?.onFinish,
    };
  },
}));

describe("useCoachPlanWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedEveAgentOptions.current = undefined;
    agentSessionState.current = {
      sessionId: undefined,
      continuationToken: undefined,
      streamIndex: 0,
    };
    agentEventsState.current = [];
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

  it("sends on the first message and bootstraps persistence once Eve assigns a session", async () => {
    const onThreadInitialized = vi.fn();
    const onSessionUrlNavigate = vi.fn();
    const plan = createEmptyWorkoutPlan();

    const { result, rerender } = renderHook(() =>
      useCoachPlanWorkspace({
        initialPlan: plan,
        planId: "plan-abc",
        onThreadInitialized,
        onSessionUrlNavigate,
      }),
    );

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    rerender();

    await waitFor(() => {
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

    await waitFor(() => {
      expect(saveSessionSnapshot).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: "Strength block",
          eve: expect.objectContaining({ sessionId: "eve-session" }),
          eveEvents: [{ type: "message.received" }],
        }),
      );
    });

    expect(onThreadInitialized).toHaveBeenCalledWith({
      sessionId: expect.any(String),
      title: "Strength block",
    });
    expect(onSessionUrlNavigate).toHaveBeenCalledWith(expect.any(String));
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
});
