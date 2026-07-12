import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import { SessionNavigationProvider } from "@/lib/chat/session-navigation-context";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";
import { DESKTOP_ARTIFACT_COLUMN_CLASS, DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS, DESKTOP_CHAT_COLLAPSED_RAIL_CLASS } from "@/lib/coach/desktop-workspace-layout";

const mockUseCoachPlanWorkspace = vi.fn();
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockUseIsMobile = vi.fn(() => false);

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock("@/lib/chat/adapters/plan/use-coach-plan-workspace", () => ({
  useCoachPlanWorkspace: (...args: unknown[]) => mockUseCoachPlanWorkspace(...args),
}));

vi.mock("@/lib/chat/adapters/plan/coach-eve-session", () => ({
  useCoachEveCatchUp: () => ({
    loadPhase: "idle",
    events: [],
    finalizeReason: null,
    stopResuming: vi.fn(),
  }),
  isCoachEveSessionLoading: () => false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/coach",
}));

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: vi.fn(async () => ({ ok: true, sessions: [] })),
}));

const mockSavePlan = vi.fn();
const mockSetPlanId = vi.fn();
const mockRestart = vi.fn();
const mockResetSaveStatus = vi.fn();

vi.mock("@/lib/plans/use-save-plan", () => ({
  useSavePlan: () => ({
    saveStatus: "idle",
    saveError: null,
    savePlan: mockSavePlan,
    resetSaveStatus: mockResetSaveStatus,
  }),
}));

vi.mock("@/components/artifact/artifact-preview", () => ({
  ArtifactPreview: ({
    onPlanChange,
  }: {
    onPlanChange: (plan: typeof samplePlan) => void;
  }) => (
    <button type="button" onClick={() => onPlanChange(samplePlan)}>
      Edit plan
    </button>
  ),
}));

const samplePlan = {
  schemaVersion: "3.0.0" as const,
  name: "Test Plan",
  weeks: [],
};

function renderCoachWorkspace(
  props: React.ComponentProps<typeof CoachWorkspace>,
) {
  return render(
    <SessionNavigationProvider>
      <CoachWorkspace {...props} />
    </SessionNavigationProvider>,
  );
}

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
    stopResponse: vi.fn(),
    setArtifactTitle: vi.fn(),
    setPlanId: mockSetPlanId,
    setArtifact: vi.fn(),
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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset conversation" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["desktop", false],
    ["mobile", true],
  ])("uses overlay prompt styling on the %s welcome composer", (_, isMobile) => {
    mockUseIsMobile.mockReturnValue(isMobile);
    mockUseCoachPlanWorkspace.mockReturnValue(mockWorkspaceReturn(mockWorkspaceState()));

    const { container } = renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(container.querySelector(".bg-surface\\/80")).not.toBeNull();
    expect(container.querySelector(".border-0.bg-transparent")).not.toBeNull();
  });

  it("uses modest padding around the desktop chat area", () => {
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    const { container } = renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(container.querySelector(".md\\:pt-14")).toBeNull();
    expect(container.innerHTML).toContain("p-4");
    expect(container.innerHTML).not.toContain("md:p-8");
    expect(screen.getByRole("button", { name: "Reset conversation" })).toBeInTheDocument();
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

    const { container } = renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(container.querySelector(".max-w-3xl")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset conversation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("does not show chat collapse control on mobile when an artifact is present", () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "Test Plan",
        }),
      ),
    );

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(
      screen.queryByRole("button", { name: "Collapse chat" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Expand chat" }),
    ).not.toBeInTheDocument();
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

    const { container } = renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset conversation" })).toBeInTheDocument();
    expect(container.querySelector(".md\\:pb-3")).toBeNull();
    expect(container.innerHTML).toContain(DESKTOP_ARTIFACT_COLUMN_CLASS);
    expect(container.innerHTML).toContain(DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS);
  });

  it("navigates to coach home on reset", async () => {
    const user = userEvent.setup();
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });
    await user.click(screen.getByRole("button", { name: "Reset conversation" }));

    expect(mockPush).toHaveBeenCalledWith("/coach");
    expect(mockRefresh).toHaveBeenCalledOnce();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("keeps reset enabled while the agent is generating", async () => {
    const user = userEvent.setup();
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
          phase: "streaming",
          runStatus: "generating",
        }),
      ),
    );

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    const resetButton = screen.getByRole("button", { name: "Reset conversation" });
    expect(resetButton).toBeEnabled();

    await user.click(resetButton);

    expect(mockPush).toHaveBeenCalledWith("/coach");
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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(
      screen.queryByRole("link", { name: "Back to plan" }),
    ).not.toBeInTheDocument();
  });

  it("adds mobile chat padding and composer inset before an artifact exists", () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    const { container } = renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(container.innerHTML).toContain("px-4");
    expect(container.innerHTML).toContain("pb-[calc(4.5rem");
    expect(screen.getByRole("button", { name: "Reset conversation" })).toBeVisible();
  });

  it("adds mobile chat padding and composer inset when chatting with an artifact", () => {
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

    const { container } = renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(container.innerHTML).toContain("px-4");
    expect(container.innerHTML).toContain("pb-[calc(4.5rem");
  });

  it("opens the artifact editor on mobile when a draft plan is provided", () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "New Plan",
        }),
      ),
    );

    renderCoachWorkspace({
      firstName: "Alex",
      role: "coach",
      initialPlan: samplePlan,
    });

    expect(screen.getByRole("button", { name: "Close artifact" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "View artifact" }),
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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

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

  it("places the mobile artifact close control beside save", async () => {
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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });
    await user.click(screen.getByRole("button", { name: "View artifact" }));

    const saveButton = screen.getByRole("button", { name: "Save" });
    const closeButton = screen.getByRole("button", { name: "Close artifact" });
    expect(saveButton.parentElement).toBe(closeButton.parentElement);
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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });
    await user.click(screen.getByRole("button", { name: "View artifact" }));
    await user.click(screen.getByRole("button", { name: "Close artifact" }));

    expect(screen.getByRole("button", { name: "View artifact" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Close artifact" }),
    ).not.toBeInTheDocument();
  });

  it("hides the composer while mobile history is open", async () => {
    const user = userEvent.setup();
    mockUseIsMobile.mockReturnValue(true);
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }),
      ),
    );

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Conversation history" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Attach" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });
    await user.click(screen.getByRole("button", { name: "Reset conversation" }));

    expect(mockPush).toHaveBeenCalledWith("/coach/plans/plan-1");
    expect(mockRestart).not.toHaveBeenCalled();
  });

  it("resets save status when the plan is edited", async () => {
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

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });
    await user.click(screen.getByRole("button", { name: "Edit plan" }));

    expect(mockResetSaveStatus).toHaveBeenCalled();
  });

  it("shows collapse chat control when an artifact is present on desktop", () => {
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "Test Plan",
        }),
      ),
    );

    renderCoachWorkspace({ firstName: "Alex", role: "coach" });

    expect(screen.getByRole("button", { name: "Collapse chat" })).toBeVisible();
  });

  it("shows a collapsed chat rail with expand control after collapse", async () => {
    const user = userEvent.setup();
    mockUseCoachPlanWorkspace.mockReturnValue(
      mockWorkspaceReturn(
        mockWorkspaceState({
          hasStarted: true,
          currentArtifact: samplePlan,
          artifactTitle: "Test Plan",
        }),
      ),
    );

    const { container } = renderCoachWorkspace({ firstName: "Alex", role: "coach" });
    await user.click(screen.getByRole("button", { name: "Collapse chat" }));

    expect(screen.getByRole("button", { name: "Expand chat" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Collapse chat" }),
    ).not.toBeInTheDocument();
    expect(container.innerHTML).toContain(DESKTOP_CHAT_COLLAPSED_RAIL_CLASS);
    expect(container.innerHTML).toContain(DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS);
  });
});
