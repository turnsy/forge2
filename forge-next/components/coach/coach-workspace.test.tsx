import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/plans/use-save-plan", () => ({
  useSavePlan: () => ({
    saveStatus: "idle",
    saveError: null,
    savePlan: vi.fn(),
    resetSaveStatus: vi.fn(),
  }),
}));

vi.mock("@/lib/chat/adapters/plan/use-coach-plan-workspace", () => ({
  useCoachPlanWorkspace: () => ({
    state: {
      sessionId: "session-1",
      hasStarted: true,
      artifactTitle: minimalWorkoutPlan.name,
      messages: [],
      currentArtifact: minimalWorkoutPlan,
      contextFileIds: [],
      attachments: [],
      runStatus: null,
      warnings: [],
      errors: [],
      phase: "idle",
      streamingAssistantText: "",
    },
    attachFiles: vi.fn(),
    sendMessage: vi.fn(),
    setArtifactTitle: vi.fn(),
    restart: vi.fn(),
  }),
}));

import { CoachWorkspace } from "@/components/coach/coach-workspace";

describe("CoachWorkspace", () => {
  it("shows the back link outside the preview pane when backHref is set", () => {
    render(
      <CoachWorkspace
        firstName="Alex"
        role="coach"
        mode="edit"
        planId="plan-1"
        initialPlan={minimalWorkoutPlan}
        backHref="/coach/plans/plan-1"
      />,
    );

    const backLink = screen.getByRole("link", { name: "Back to plan" });
    const workspaceRoot = backLink.closest(".overflow-x-visible");

    expect(backLink).toBeVisible();
    expect(workspaceRoot).not.toBeNull();
  });
});
