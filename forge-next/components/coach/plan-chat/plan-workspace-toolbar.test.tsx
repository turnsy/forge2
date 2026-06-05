import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlanWorkspaceToolbar } from "@/components/coach/plan-chat/plan-workspace-toolbar";

describe("PlanWorkspaceToolbar", () => {
  it("renders a page-style header with title input and save button", () => {
    const { container } = render(
      <PlanWorkspaceToolbar
        planTitle="Summer block"
        saveDisabled={false}
        onPlanTitleChange={vi.fn()}
      />,
    );
    expect(container.querySelector("header")).toBeTruthy();
    expect(screen.getByLabelText("Plan title")).toHaveValue("Summer block");
    expect(screen.getByLabelText("Plan title")).toHaveClass("bg-transparent");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("disables save while chat is running", () => {
    render(
      <PlanWorkspaceToolbar
        planTitle=""
        saveDisabled
        onPlanTitleChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("calls onPlanTitleChange when typing", async () => {
    const user = userEvent.setup();
    const onPlanTitleChange = vi.fn();
    render(
      <PlanWorkspaceToolbar
        planTitle=""
        saveDisabled={false}
        onPlanTitleChange={onPlanTitleChange}
      />,
    );
    await user.type(screen.getByLabelText("Plan title"), "A");
    expect(onPlanTitleChange).toHaveBeenCalled();
  });
});
