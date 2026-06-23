import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

const { saveSessionSnapshot, streamPlanChat } = vi.hoisted(() => ({
  saveSessionSnapshot: vi.fn(),
  streamPlanChat: vi.fn(),
}));

vi.mock("@/lib/chat/actions", () => ({
  saveSessionSnapshot,
}));

vi.mock("@/lib/chat/adapters/plan/plan-chat-client", () => ({
  streamPlanChat,
}));

describe("useCoachPlanWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamPlanChat.mockImplementation(async ({ onEvent }) => {
      onEvent({ type: "assistantTextDelta", delta: "Done." });
      return null;
    });
    saveSessionSnapshot.mockResolvedValue({
      ok: true,
      title: "Strength block",
    });
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

  it("calls onSessionPersisted once after the first successful save", async () => {
    const onSessionPersisted = vi.fn();

    const { result } = renderHook(() =>
      useCoachPlanWorkspace({ onSessionPersisted }),
    );

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    expect(onSessionPersisted).toHaveBeenCalledOnce();
    expect(onSessionPersisted).toHaveBeenCalledWith(
      result.current.state.sessionId,
    );
  });

  it("does not call onSessionPersisted when save fails", async () => {
    saveSessionSnapshot.mockResolvedValue({
      ok: false,
      message: "save failed",
    });
    const onSessionPersisted = vi.fn();

    const { result } = renderHook(() =>
      useCoachPlanWorkspace({ onSessionPersisted }),
    );

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    expect(onSessionPersisted).not.toHaveBeenCalled();
  });
});
