import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

const mockUseCoachPlanWorkspace = vi.fn();

vi.mock("@/lib/chat/adapters/plan/use-coach-plan-workspace", () => ({
  useCoachPlanWorkspace: (...args: unknown[]) => mockUseCoachPlanWorkspace(...args),
}));

vi.mock("@/lib/plans/use-save-plan", () => ({
  useSavePlan: () => ({
    saveStatus: "idle",
    saveError: null,
    savePlan: vi.fn(),
    resetSaveStatus: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const samplePlan = {
  schemaVersion: "2.0.0" as const,
  name: "Test Plan",
  weeks: [],
};

function mockWorkspaceState(
  overrides: Partial<PlanWorkspaceState> = {},
): PlanWorkspaceState {
  return {
    sessionId: "session-1",
    hasStarted: false,
    artifactTitle: "",
    planId: null,
    messages: [],
    currentArtifact: null,
    contextFileIds: [],
    attachments: [],
    runStatus: null,
    warnings: [],
    errors: [],
    phase: "idle",
    streamingAssistantText: "",
    ...overrides,
  };
}

describe("CoachWorkspace layout", () => {
  it("shows welcome before first message", () => {
    mockUseCoachPlanWorkspace.mockReturnValue({
      state: mockWorkspaceState(),
      attachFiles: vi.fn(),
      sendMessage: vi.fn(),
      setArtifactTitle: vi.fn(),
      restart: vi.fn(),
    });

    render(
      <CoachWorkspace firstName="Alex" role="coach" />,
    );

    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
  });

  it("shows centered chat without split when started but no artifact", () => {
    mockUseCoachPlanWorkspace.mockReturnValue({
      state: mockWorkspaceState({
        hasStarted: true,
        messages: [{ role: "user", content: "Hello" }],
      }),
      attachFiles: vi.fn(),
      sendMessage: vi.fn(),
      setArtifactTitle: vi.fn(),
      restart: vi.fn(),
    });

    const { container } = render(
      <CoachWorkspace firstName="Alex" role="coach" />,
    );

    expect(container.querySelector(".max-w-3xl")).toBeTruthy();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("shows split pane when artifact is present", () => {
    mockUseCoachPlanWorkspace.mockReturnValue({
      state: mockWorkspaceState({
        hasStarted: true,
        currentArtifact: samplePlan,
        artifactTitle: "Test Plan",
      }),
      attachFiles: vi.fn(),
      sendMessage: vi.fn(),
      setArtifactTitle: vi.fn(),
      restart: vi.fn(),
    });

    render(
      <CoachWorkspace firstName="Alex" role="coach" />,
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });
});
