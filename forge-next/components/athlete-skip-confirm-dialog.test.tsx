import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AthleteSkipConfirmDialog } from "@/components/athlete-skip-confirm-dialog";

describe("AthleteSkipConfirmDialog", () => {
  it("renders skip confirmation copy and actions", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <AthleteSkipConfirmDialog
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Some sets still need input. These will be marked as skipped.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Skip & Complete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
