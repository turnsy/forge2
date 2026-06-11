import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

const mockUseCoachPlanWorkspace = vi.fn();
const mockPush = vi.fn();
const mockUseIsMobile = vi.fn(() => false);

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock("@/lib/chat/adapters/plan/use-coach-plan-workspace", () => ({
  useCoachPlanWorkspace: (...args: unknown[]) => mockUseCoachPlanWorkspace(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
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
    mockUseIsMobile.mockReturnValue(false);
  });

  it("shows welcome before first message", () => {
    mockUseCoachPlanWorkspace.mockReturnValue(mockWorkspaceReturn(mockWorkspaceState()));

    render(<CoachWorkspace firstName="Alex" role="coach" />);

    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close workspace" }),
    ).not.toBeInTheDocument();
  });

  it("reserves top padding for the close button in single-pane chat", () => {
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    const { container } = render(<CoachWorkspace firstName="Alex" role="coach" />);

    expect(container.querySelector(".md\\:pt-14")).toBeTruthy();
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

  it("shows the back link when a saved plan is in workspace state", () => {
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

    render(<CoachWorkspace firstName="Alex" role="coach" />);

    const backLink = screen.getByRole("link", { name: "Back to plan" });
    expect(backLink).toBeVisible();
    expect(backLink).toHaveAttribute("href", "/coach/plans/plan-1");
  });

  it("does not show back link before a plan is saved", () => {
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

    expect(
      screen.queryByRole("link", { name: "Back to plan" }),
    ).not.toBeInTheDocument();
  });

  it("shows View above the composer on mobile when an artifact exists", async () => {
    const user = userEvent.setup();
    mockUseIsMobile.mockReturnValue(true);
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "Test Plan",
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    render(<CoachWorkspace firstName="Alex" role="coach" />);

    expect(screen.getByRole("button", { name: "View artifact" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Close artifact" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View artifact" }));

    expect(screen.getByRole("button", { name: "Close artifact" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "View artifact" }),
    ).not.toBeInTheDocument();
  });

  it("returns to chat when the mobile artifact close button is pressed", async () => {
    const user = userEvent.setup();
    mockUseIsMobile.mockReturnValue(true);
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "Test Plan",
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    render(<CoachWorkspace firstName="Alex" role="coach" />);
    await user.click(screen.getByRole("button", { name: "View artifact" }));
    await user.click(screen.getByRole("button", { name: "Close artifact" }));

    expect(screen.getByRole("button", { name: "View artifact" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Close artifact" }),
    ).not.toBeInTheDocument();
  });

  it("navigates to plan detail on close when a saved plan is loaded", async () => {
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

    render(<CoachWorkspace firstName="Alex" role="coach" />);
    await user.click(screen.getByRole("button", { name: "Close workspace" }));

    expect(mockPush).toHaveBeenCalledWith("/coach/plans/plan-1");
    expect(mockRestart).not.toHaveBeenCalled();
  });
});
