import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockCreateCoachPlanClient = vi.fn();
const mockSaveCoachPlanVersionClient = vi.fn();

vi.mock("@/lib/plans/save-plan-client", () => ({
  createCoachPlanClient: (...args: unknown[]) => mockCreateCoachPlanClient(...args),
  saveCoachPlanVersionClient: (...args: unknown[]) =>
    mockSaveCoachPlanVersionClient(...args),
}));

import { useSavePlan } from "@/lib/plans/use-save-plan";

describe("useSavePlan", () => {
  beforeEach(() => {
    mockCreateCoachPlanClient.mockReset();
    mockSaveCoachPlanVersionClient.mockReset();
    mockCreateCoachPlanClient.mockResolvedValue({
      ok: true,
      planId: "plan-1",
      versionId: "version-1",
    });
    mockSaveCoachPlanVersionClient.mockResolvedValue({
      ok: true,
      planId: "plan-1",
      versionId: "version-2",
    });
  });

  it("creates a plan when planId is null", async () => {
    const { result } = renderHook(() => useSavePlan(null));

    let saved: { planId: string; versionId: string } | null = null;

    await act(async () => {
      saved = await result.current.savePlan({
        plan: minimalWorkoutPlan,
        title: "Plan",
      });
    });

    expect(saved).toEqual({ planId: "plan-1", versionId: "version-1" });
    expect(mockCreateCoachPlanClient).toHaveBeenCalled();
    expect(result.current.saveStatus).toBe("saving");
  });

  it("saves a version when planId is set", async () => {
    const { result } = renderHook(() => useSavePlan("plan-1"));

    await act(async () => {
      await result.current.savePlan({
        plan: minimalWorkoutPlan,
        title: "Plan",
      });
    });

    expect(mockSaveCoachPlanVersionClient).toHaveBeenCalledWith({
      planId: "plan-1",
      plan: minimalWorkoutPlan,
      title: "Plan",
    });
    expect(result.current.saveStatus).toBe("saved");
  });

  it("resets save status after edit save", async () => {
    const { result } = renderHook(() => useSavePlan("plan-1"));

    await act(async () => {
      await result.current.savePlan({
        plan: minimalWorkoutPlan,
        title: "Plan",
      });
    });

    act(() => {
      result.current.resetSaveStatus();
    });

    expect(result.current.saveStatus).toBe("idle");
  });

  it("surfaces save errors", async () => {
    mockCreateCoachPlanClient.mockResolvedValue({
      ok: false,
      message: "Failed to save plan",
    });

    const { result } = renderHook(() => useSavePlan(null));

    await act(async () => {
      await result.current.savePlan({
        plan: minimalWorkoutPlan,
        title: "Plan",
      });
    });

    await waitFor(() => {
      expect(result.current.saveError).toBe("Failed to save plan");
      expect(result.current.saveStatus).toBe("idle");
    });
  });
});
