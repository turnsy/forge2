import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

const {
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
  mockSend,
  mockReset,
} = vi.hoisted(() => ({
  saveSessionSnapshot: vi.fn(),
  generateSessionTitleFromPrompt: vi.fn(),
  mockSend: vi.fn(),
  mockReset: vi.fn(),
}));

vi.mock("@/lib/chat/actions", () => ({
  saveSessionSnapshot,
  generateSessionTitleFromPrompt,
}));

vi.mock("eve/react", () => ({
  useEveAgent: () => ({
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
  }),
}));

describe("useCoachPlanWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("delegates sendMessage to useEveAgent", async () => {
    const { result } = renderHook(() => useCoachPlanWorkspace());

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    expect(mockSend).toHaveBeenCalledWith({ message: "Hello" });
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
