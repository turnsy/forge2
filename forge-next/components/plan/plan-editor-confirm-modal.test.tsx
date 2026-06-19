import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlanEditorConfirmModal } from "@/components/plan/plan-editor-confirm-modal";

describe("PlanEditorConfirmModal", () => {
  it("renders confirmation copy and actions", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <PlanEditorConfirmModal
        open
        title="Delete day?"
        description="This day and all of its exercises will be removed from the plan."
        confirmLabel="Delete day"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Delete day" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
