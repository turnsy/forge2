import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

const mockUseCoachPlanWorkspace = vi.fn();
const mockPush = vi.fn();

vi.mock("@/lib/chat/adapters/plan/use-coach-plan-workspace", () => ({
  useCoachPlanWorkspace: (...args: unknown[]) => mockUseCoachPlanWorkspace(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSavePlan = vi.fn();
const mockSetPlanId = vi.fn();
const mockRestart = vi.fn();

vi.mock("@/lib/plans/use-save-plan", () => ({
  useSavePlan: () => ({
    saveStatus: "idle",
    saveError: null,
    savePlan: mockSavePlan,
    resetSaveStatus: vi.fn(),
  }),
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

function mockWorkspaceReturn(state: PlanWorkspaceState) {
  return {
    state,
    attachFiles: vi.fn(),
    sendMessage: vi.fn(),
    setArtifactTitle: vi.fn(),
    setPlanId: mockSetPlanId,
    restart: mockRestart,
  };
}

describe("CoachWorkspace layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows welcome before first message", () => {
    mockUseCoachPlanWorkspace.mockReturnValue(mockWorkspaceReturn(mockWorkspaceState()));

    render(<CoachWorkspace firstName="Alex" role="coach" />);

    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close workspace" }),
    ).not.toBeInTheDocument();
  });

  it("shows centered chat without split when started but no artifact", () => {
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    const { container } = render(<CoachWorkspace firstName="Alex" role="coach" />);

    expect(container.querySelector(".max-w-3xl")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close workspace" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("shows split layout when artifact is present", () => {
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "Test Plan",
        }),
      ),
    );

    render(<CoachWorkspace firstName="Alex" role="coach" />);

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close workspace" })).toBeInTheDocument();
  });

  it("restarts workspace on close from coach home", async () => {
    const user = userEvent.setup();
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    render(<CoachWorkspace firstName="Alex" role="coach" />);
    await user.click(screen.getByRole("button", { name: "Close workspace" }));

    expect(mockRestart).toHaveBeenCalledOnce();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to plan detail on close from edit route", async () => {
    const user = userEvent.setup();
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "Test Plan",
          planId: "plan-1",
        }),
      ),
    );

    render(
      <CoachWorkspace
        firstName="Alex"
        role="coach"
        mode="edit"
        planId="plan-1"
        initialPlan={samplePlan}
        backHref="/coach/plans/plan-1"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Close workspace" }));

    expect(mockPush).toHaveBeenCalledWith("/coach/plans/plan-1");
    expect(mockRestart).not.toHaveBeenCalled();
  });
});
