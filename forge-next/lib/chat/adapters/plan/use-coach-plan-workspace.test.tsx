import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import {
  SessionNavigationProvider,
  useSessionNavigation,
  type PendingFirstSend,
} from "@/lib/chat/session-navigation-context";
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
  initCoachThread,
  persistCoachSessionEve,
  mockSend,
  mockReset,
  mockStop,
} = vi.hoisted(() => ({
  saveSessionSnapshot: vi.fn(),
  generateSessionTitleFromPrompt: vi.fn(),
  initCoachThread: vi.fn(),
  persistCoachSessionEve: vi.fn(),
  mockSend: vi.fn(),
  mockReset: vi.fn(),
  mockStop: vi.fn(),
}));

vi.mock("@/lib/chat/actions", () => ({
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
  initCoachThread,
  persistCoachSessionEve,
}));

vi.mock("eve/react", () => ({
  useEveAgent: (options?: {
    prepareSend?: (input: { message: string }) => {
      message: string;
      clientContext?: unknown;
    };
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
    send: (input: { message: string }) => {
      const prepared = options?.prepareSend?.(input) ?? input;
      return mockSend(prepared);
    },
    reset: mockReset,
    stop: mockStop,
    onFinish: options?.onFinish,
  }),
}));

function createSessionNavigationWrapper(pending: PendingFirstSend) {
  let stashed = false;

  function Wrapper({ children }: { children: ReactNode }) {
    const sessionNavigation = useSessionNavigation();

    if (!stashed) {
      sessionNavigation.stashPendingFirstSend(pending);
      stashed = true;
    }

    return children;
  }

  return function SessionNavigationTestWrapper({
    children,
  }: {
    children: ReactNode;
  }) {
    return (
      <SessionNavigationProvider>
        <Wrapper>{children}</Wrapper>
      </SessionNavigationProvider>
    );
  };
}

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
    const onFirstSendNavigate = vi.fn();
    const plan = createEmptyWorkoutPlan();
    const { result } = renderHook(() =>
      useCoachPlanWorkspace({
        initialPlan: plan,
        planId: "plan-abc",
        onThreadInitialized,
        onFirstSendNavigate,
      }),
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
    expect(onFirstSendNavigate).toHaveBeenCalledWith({
      sessionId: expect.any(String),
      message: "Hello",
      clientArtifact: expect.objectContaining({
        plan,
        planId: "plan-abc",
      }),
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("includes the plan artifact in clientContext when consuming a pending first send", async () => {
    const plan = createEmptyWorkoutPlan();
    plan.name = "Existing plan";
    const sessionId = "session-123";
    const pending: PendingFirstSend = {
      sessionId,
      message: "Tweak week one volume",
      clientArtifact: {
        plan,
        planId: "plan-abc",
        title: "Existing plan",
      },
    };

    renderHook(
      () =>
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
      { wrapper: createSessionNavigationWrapper(pending) },
    );

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Tweak week one volume",
          clientContext: expect.objectContaining({
            clientArtifact: expect.objectContaining({
              plan,
              planId: "plan-abc",
              title: "Existing plan",
            }),
          }),
        }),
      );
    });
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
    const onFirstSendNavigate = vi.fn();
    const { result } = renderHook(() =>
      useCoachPlanWorkspace({ onFirstSendNavigate }),
    );

    await act(async () => {
      await result.current.sendMessage([
        { type: "text", value: "Build a bench plan" },
      ]);
    });

    expect(generateSessionTitleFromPrompt).toHaveBeenCalledWith(
      "Build a bench plan",
    );
    expect(onFirstSendNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Build a bench plan" }),
    );
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("stops the in-flight agent response", () => {
    const { result } = renderHook(() => useCoachPlanWorkspace());

    act(() => {
      result.current.stopResponse();
    });

    expect(mockStop).toHaveBeenCalledOnce();
  });
});
