import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceCloseButton } from "@/components/coach/workspace-close-button";

describe("WorkspaceCloseButton", () => {
  it("renders a bordered secondary reset button by default", () => {
    render(<WorkspaceCloseButton onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Reset conversation" });
    expect(button.className).toContain("border-glass-border");
  });

  it("supports a close variant", () => {
    render(
      <WorkspaceCloseButton variant="close" ariaLabel="Close artifact" onClick={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Close artifact" })).toBeInTheDocument();
  });
});
