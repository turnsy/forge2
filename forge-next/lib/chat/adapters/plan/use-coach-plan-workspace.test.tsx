import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";
import { CANCEL_INPUT_REQUEST_TEXT, selectionResponse } from "@/lib/chat/input-selection";
import type { InputRequest } from "eve/client";

const mockSearchParams = vi.fn(() => new URLSearchParams());
const mockPathname = vi.fn(() => "/coach");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
  usePathname: () => mockPathname(),
}));

const {
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
  listSessionAttachments,
  removeSessionAttachments,
  mockSend,
  uploadContextFile,
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
  listSessionAttachments: vi.fn(),
  removeSessionAttachments: vi.fn(),
  mockSend: vi.fn(),
  uploadContextFile: vi.fn(),
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
  listSessionAttachments,
  removeSessionAttachments,
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

vi.mock("@/lib/chat/adapters/plan/upload-context-client", () => ({ uploadContextFile }));

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
  it("can cancel a selection-only question without submitting a candidate", async () => {
    agentSessionState.current = { sessionId: "eve-session", continuationToken: "token", streamIndex: 2 };
    Object.assign(agentDataState.current, { pendingInputRequests: [{
      requestId: "question-1", display: "select", allowFreeform: false,
      options: [{ id: "jay-1", label: "Jay" }],
    }] });
    const { result } = renderHook(() => useCoachPlanWorkspace());
    await act(async () => {
      await result.current.respondToInput({ requestId: "question-1", text: CANCEL_INPUT_REQUEST_TEXT });
    });
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      inputResponses: [{ requestId: "question-1", text: CANCEL_INPUT_REQUEST_TEXT }],
    }));
    expect(mockSend.mock.calls[0][0].clientContext).toBeUndefined();
  });
  it("does not submit an approval after Eve has reset a failed session cursor", async () => {
    Object.assign(agentDataState.current, { pendingInputRequests: [{
      requestId: "approval-1", display: "confirmation", options: [{ id: "approve", label: "Yes" }],
    }] });
    const { result } = renderHook(() => useCoachPlanWorkspace());
    await act(async () => {
      await result.current.respondToInput({ requestId: "approval-1", optionId: "approve" });
    });
    expect(mockSend).not.toHaveBeenCalled();
    expect(result.current.state.errors[0].message).toContain("conversation has ended");
  });
  it.each([false, true])("resumes a multiple-choice question in one response, cancellation=%s", async (cancelled) => {
    agentSessionState.current = { sessionId: "eve-session", continuationToken: "token", streamIndex: 2 };
    const request: InputRequest = {
      requestId: "question-1", prompt: "Which athletes?", display: "select", allowFreeform: false,
      options: [{ id: "athlete-1", label: "Jay" }, { id: "athlete-2", label: "Jane" }],
      action: { kind: "tool-call", callId: "question-1", toolName: "ask_question", input: { selectionMode: "multiple" } },
    };
    Object.assign(agentDataState.current, { pendingInputRequests: [request] });
    const { result } = renderHook(() => useCoachPlanWorkspace());
    const response = selectionResponse(request, ["athlete-1", "athlete-2"], cancelled);
    await act(async () => { await result.current.respondToInput(response); });
    expect(mockSend).toHaveBeenCalledExactlyOnceWith({ inputResponses: [response] });
    expect(mockSend.mock.calls[0][0].clientContext).toBeUndefined();
  });

  it("resumes a pending assignment approval with inputResponses on the existing agent", async () => {
    agentSessionState.current = { sessionId: "eve-session", continuationToken: "token", streamIndex: 2 };
    const request = {
      requestId: "approval-1", prompt: "Assign this plan?", display: "confirmation",
      options: [{ id: "approve", label: "Approve" }, { id: "deny", label: "Deny" }],
      action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {} },
    };
    Object.assign(agentDataState.current, { pendingInputRequests: [request] });
    const { result } = renderHook(() => useCoachPlanWorkspace());
    expect(result.current.state.pendingInputRequests).toEqual([request]);
    await act(async () => {
      await result.current.respondToInput({ requestId: request.requestId, optionId: "approve" });
    });
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      inputResponses: [{ requestId: request.requestId, optionId: "approve" }],
    }));
    expect(mockSend.mock.calls[0][0].clientContext).toBeUndefined();
    expect(generateSessionTitleFromPrompt).not.toHaveBeenCalled();
  });

  it("does not treat ordinary chat text or invalid options as approval", async () => {
    agentSessionState.current = { sessionId: "eve-session", continuationToken: "token", streamIndex: 2 };
    Object.assign(agentDataState.current, { pendingInputRequests: [{
      requestId: "approval-1", display: "confirmation", options: [{ id: "approve", label: "Approve" }],
    }] });
    const { result } = renderHook(() => useCoachPlanWorkspace());
    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
      await result.current.respondToInput({ requestId: "approval-1", text: "yes" });
      await result.current.respondToInput({ requestId: "approval-1", optionId: "unknown" });
    });
    expect(mockSend).not.toHaveBeenCalled();
  });
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
    listSessionAttachments.mockResolvedValue({ ok: true, attachments: [] });
    removeSessionAttachments.mockResolvedValue({ ok: true, attachments: [] });
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

  it("aborts the Eve store when stopping an in-flight response", () => {
    agentDataState.current = {
      ...agentDataState.current,
      messages: [{ role: "user", content: "Build a plan" }],
      runStatus: "generating",
      phase: "streaming",
    };
    agentStatusState.current = "streaming";

    const { result } = renderHook(() => useCoachPlanWorkspace());

    act(() => {
      result.current.stopResponse();
    });

    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("finalizes immediately when stopping a background turn (stream already ended)", () => {
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
    agentStatusState.current = "ready";

    const { result } = renderHook(() => useCoachPlanWorkspace());

    expect(result.current.state.runStatus).toBe("generating");
    expect(result.current.state.phase).toBe("streaming");

    act(() => {
      result.current.stopResponse();
    });

    // No fetch to abort; the turn is finalized locally without touching Eve.
    expect(mockStop).not.toHaveBeenCalled();
    expect(result.current.state.runStatus).toBeNull();
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.errors).toEqual([]);
  });

  it("persists a stopped marker when stopping a background turn", async () => {
    agentSessionState.current = {
      sessionId: "eve-session",
      continuationToken: "token",
      streamIndex: 2,
    };
    agentEventsState.current = [
      { type: "message.received" },
      { type: "turn.started" },
    ];
    agentDataState.current = {
      ...agentDataState.current,
      messages: [{ role: "user", content: "Build a plan" }],
      runStatus: "generating",
      phase: "idle",
    };
    agentStatusState.current = "ready";

    const { result } = renderHook(() => useCoachPlanWorkspace());

    await act(async () => {
      result.current.stopResponse();
    });

    await waitFor(() => {
      expect(saveSessionSnapshot).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          lastTurn: { status: "stopped", eventCount: 2 },
        }),
      );
    });
  });

  it("shows stopping (finalized view) while the Eve store winds down, then settles idle", async () => {
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

    const { result, rerender } = renderHook(() => useCoachPlanWorkspace());

    expect(result.current.state.phase).toBe("streaming");

    act(() => {
      result.current.stopResponse();
    });

    // Store still winding down: partial text is already materialized.
    expect(mockStop).toHaveBeenCalledOnce();
    expect(result.current.state.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "assistant", content: "Partial" },
    ]);
    expect(result.current.state.streamingAssistantText).toBe("");

    // The abort settles: the store returns to ready with abort debris and
    // fires onFinish.
    agentDataState.current = {
      ...agentDataState.current,
      runStatus: "error",
      phase: "error",
      errors: [{ message: "fetch is aborted" }],
    };
    agentStatusState.current = "ready";
    await act(async () => {
      await capturedEveAgentOptions.current?.onFinish?.({
        session: agentSessionState.current,
        events: agentEventsState.current,
      });
    });
    rerender();

    await waitFor(() => {
      expect(result.current.state.phase).toBe("idle");
    });
    expect(result.current.state.errors).toEqual([]);
    expect(result.current.state.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "assistant", content: "Partial" },
    ]);
  });

  it("allows sending again immediately after a stop settles", async () => {
    agentDataState.current = {
      ...agentDataState.current,
      messages: [{ role: "user", content: "Build a plan" }],
      runStatus: "generating",
      streamingAssistantText: "Partial",
      phase: "streaming",
    };
    agentStatusState.current = "streaming";

    const { result, rerender } = renderHook(() => useCoachPlanWorkspace());

    act(() => {
      result.current.stopResponse();
    });

    agentStatusState.current = "ready";
    agentDataState.current = {
      ...agentDataState.current,
      runStatus: null,
      streamingAssistantText: "",
      phase: "idle",
    };
    await act(async () => {
      await capturedEveAgentOptions.current?.onFinish?.({
        session: agentSessionState.current,
        events: agentEventsState.current,
      });
    });
    rerender();

    await waitFor(() => {
      expect(result.current.state.phase).toBe("idle");
    });

    await act(async () => {
      await result.current.sendMessage([
        { type: "text", value: "Actually, make it 3 days" },
      ]);
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Actually, make it 3 days" }),
    );
  });

  it("keeps the stopped user message when sending again after an abort", async () => {
    agentDataState.current = {
      ...agentDataState.current,
      messages: [{ role: "user", content: "Build a plan" }],
      runStatus: "generating",
      phase: "streaming",
    };
    agentStatusState.current = "streaming";

    const { result, rerender } = renderHook(() => useCoachPlanWorkspace());

    act(() => {
      result.current.stopResponse();
    });

    // Eve replays client.message.failed after abort; the reducer keeps the text.
    agentStatusState.current = "ready";
    agentDataState.current = {
      ...agentDataState.current,
      messages: [{ role: "user", content: "Build a plan" }],
      runStatus: null,
      streamingAssistantText: "",
      phase: "streaming",
      errors: [],
    };
    await act(async () => {
      await capturedEveAgentOptions.current?.onFinish?.({
        session: agentSessionState.current,
        events: agentEventsState.current,
      });
    });
    rerender();

    mockSend.mockImplementation(async (input: { message: string }) => {
      agentDataState.current = {
        ...agentDataState.current,
        messages: [
          ...agentDataState.current.messages,
          { role: "user", content: input.message },
        ],
        phase: "streaming",
      };
      agentStatusState.current = "streaming";
      agentEventsState.current = [
        ...agentEventsState.current,
        { type: "message.received" },
      ];
    });

    await act(async () => {
      await result.current.sendMessage([
        { type: "text", value: "Actually, make it 3 days" },
      ]);
    });
    rerender();

    expect(result.current.state.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "user", content: "Actually, make it 3 days" },
    ]);
  });

  it("blocks sends while a stop is still settling", async () => {
    agentDataState.current = {
      ...agentDataState.current,
      messages: [{ role: "user", content: "Build a plan" }],
      runStatus: "generating",
      phase: "streaming",
    };
    agentStatusState.current = "streaming";

    const { result } = renderHook(() => useCoachPlanWorkspace());

    act(() => {
      result.current.stopResponse();
    });

    // Still winding down (status has not settled): send must not throw into
    // the busy Eve store.
    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Too soon" }]);
    });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it("surfaces send failures instead of leaving an unhandled rejection", async () => {
    mockSend.mockRejectedValue(new Error("eve session is already processing a turn."));

    const { result } = renderHook(() => useCoachPlanWorkspace());

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    expect(result.current.state.errors).toEqual([
      { message: "eve session is already processing a turn." },
    ]);
  });

  it("restores a stopped thread as settled via initialFinalizeReason", () => {
    agentDataState.current = {
      ...agentDataState.current,
      messages: [{ role: "user", content: "Build a plan" }],
      runStatus: "generating",
      streamingAssistantText: "Partial from before",
      phase: "streaming",
    };
    agentStatusState.current = "ready";
    agentEventsState.current = [
      { type: "message.received" },
      { type: "turn.started" },
    ];

    const { result } = renderHook(() =>
      useCoachPlanWorkspace({
        initialSession: {
          id: "session-1",
          snapshot: {
            title: "Old thread",
            forgeSessionId: "session-1",
            eve: {
              sessionId: "eve-session",
              continuationToken: "token",
              streamIndex: 2,
            },
          },
        },
        syncedEvents: agentEventsState.current,
        initialFinalizeReason: "restored",
      }),
    );

    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.runStatus).toBe("done");
    expect(result.current.state.messages).toEqual([
      { role: "user", content: "Build a plan" },
      { role: "assistant", content: "Partial from before" },
    ]);
    expect(result.current.state.errors).toEqual([]);
  });

  it("renders the catch-up projection and blocks sends while resuming", async () => {
    const onStopResuming = vi.fn();

    const { result } = renderHook(() =>
      useCoachPlanWorkspace({
        initialSession: {
          id: "session-live",
          snapshot: {
            title: "Live thread",
            forgeSessionId: "session-live",
            eve: {
              sessionId: "eve-session",
              continuationToken: "token",
              streamIndex: 2,
            },
          },
        },
        syncedEvents: [
          { type: "message.received", data: { message: "Build a plan" } },
          { type: "turn.started", data: { turnId: "t1", sequence: 1 } },
        ] as never[],
        resuming: true,
        onStopResuming,
      }),
    );

    expect(result.current.state.phase).toBe("streaming");
    expect(result.current.state.runStatus).toBe("generating");
    expect(result.current.state.messages).toEqual([
      { role: "user", content: "Build a plan" },
    ]);

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });
    expect(mockSend).not.toHaveBeenCalled();

    act(() => {
      result.current.stopResponse();
    });
    expect(onStopResuming).toHaveBeenCalledOnce();
    expect(mockStop).not.toHaveBeenCalled();
  });

  it("restores sent attachments on their message, leaving the composer empty", () => {
    agentDataState.current.messages = [{ role: "user", content: "Use this" }];
    const attachment = { localId: "sent", status: "uploaded" as const, displayLabel: "plan.png", contextFileIds: ["coach/session/plan.png"] };
    const { result } = renderHook(() => useCoachPlanWorkspace({ initialSession: {
      id: "session-1", snapshot: { title: "Plan", forgeSessionId: "session-1", eve: null,
        messageAttachments: [{ userMessageIndex: 0, attachments: [attachment] }],
      },
    } }));
    expect(result.current.state.messages[0].attachments).toEqual([attachment]);
    expect(result.current.state.attachments).toEqual([]);
    expect(listSessionAttachments).not.toHaveBeenCalled();
  });

  it("only removes an unsent attachment, without reintroducing sent bucket files", async () => {
    uploadContextFile.mockResolvedValue({ ok: true, contextFileIds: ["coach/session/new.txt"] });
    removeSessionAttachments.mockResolvedValue({ ok: true, attachments: [{ localId: "old", status: "uploaded", displayLabel: "sent file" }] });
    const { result } = renderHook(() => useCoachPlanWorkspace());
    await act(async () => { await result.current.attachFiles([new File(["a,b"], "new.csv")]); });
    const localId = result.current.state.attachments[0].localId;
    await act(async () => { await result.current.removeAttachment(localId); });
    expect(removeSessionAttachments).toHaveBeenCalledWith(expect.any(String), ["coach/session/new.txt"]);
    expect(result.current.state.attachments).toEqual([]);
  });

  it("blocks send during upload, then drops failures and binds successful files to the message", async () => {
    let completeUpload: ((result: unknown) => void) | undefined;
    uploadContextFile.mockImplementationOnce(() => new Promise((resolve) => { completeUpload = resolve; }));
    const { result, rerender } = renderHook(() => useCoachPlanWorkspace());
    let upload: Promise<void>;
    act(() => { upload = result.current.attachFiles([new File(["x"], "first.csv")]); });
    await act(async () => { await result.current.sendMessage([{ type: "text", value: "Use this" }]); });
    expect(mockSend).not.toHaveBeenCalled();
    await act(async () => { completeUpload?.({ ok: true, contextFileIds: ["coach/session/first.txt"] }); await upload; });
    uploadContextFile.mockResolvedValueOnce({ ok: false, error: "STORAGE_FAILED", message: "Upload failed" });
    await act(async () => { await result.current.attachFiles([new File(["x"], "failed.csv")]); });
    await act(async () => { await result.current.sendMessage([{ type: "text", value: "Use this" }]); });
    expect(result.current.state.attachments).toEqual([]);
    agentDataState.current.messages = [{ role: "user", content: "Use this" }, { role: "assistant", content: "Done" }, { role: "user", content: "Next" }];
    rerender();
    expect(result.current.state.messages[0].attachments?.map((item) => item.displayLabel)).toEqual(["first.csv"]);
    expect(result.current.state.messages[2].attachments).toBeUndefined();
    expect(saveSessionSnapshot).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ messageAttachments: [expect.objectContaining({ userMessageIndex: 0, attachments: [expect.objectContaining({ displayLabel: "first.csv" })] })] }));
  });

  it("continues persisting the old thread after unmount without redirecting back", async () => {
    const onSessionUrlNavigate = vi.fn();
    let finishSend: (() => void) | undefined;
    mockSend.mockImplementationOnce(() => new Promise<void>((resolve) => { finishSend = resolve; }));
    const { result, unmount } = renderHook(() => useCoachPlanWorkspace({ onSessionUrlNavigate }));
    let pending: Promise<void>;
    act(() => { pending = result.current.sendMessage([{ type: "text", value: "Make a plan" }]); });
    await waitFor(() => expect(mockSend).toHaveBeenCalled());
    const callbacks = capturedEveAgentOptions.current;
    unmount();
    onSessionUrlNavigate.mockClear();
    await act(async () => {
      await callbacks?.onFinish?.({ session: { sessionId: "eve-session", continuationToken: "token", streamIndex: 2 }, events: [{ type: "message.received" }, { type: "session.waiting" }] });
      finishSend?.();
      await pending;
    });
    expect(mockStop).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
    expect(onSessionUrlNavigate).not.toHaveBeenCalled();
    expect(saveSessionSnapshot).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ eveEvents: [{ type: "message.received" }, { type: "session.waiting" }] }));
  });

  it("persists and redirects again after restart on the home workspace", async () => {
    const onThreadInitialized = vi.fn();
    const onSessionUrlNavigate = vi.fn();

    const { result } = renderHook(() =>
      useCoachPlanWorkspace({
        onThreadInitialized,
        onSessionUrlNavigate,
      }),
    );

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "First thread" }]);
    });

    await act(async () => {
      await capturedEveAgentOptions.current?.onFinish?.({
        session: {
          sessionId: "eve-session",
          continuationToken: "token",
          streamIndex: 2,
        },
        events: [
          { type: "message.received" },
          { type: "session.waiting" },
        ],
      });
    });

    expect(onSessionUrlNavigate).toHaveBeenCalledTimes(1);
    onThreadInitialized.mockClear();
    onSessionUrlNavigate.mockClear();
    saveSessionSnapshot.mockClear();

    act(() => {
      result.current.restart();
    });

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Second thread" }]);
    });

    await waitFor(() => {
      expect(saveSessionSnapshot).toHaveBeenCalled();
      expect(onThreadInitialized).toHaveBeenCalledWith({
        sessionId: expect.any(String),
        title: "Strength block",
      });
      expect(onSessionUrlNavigate).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
