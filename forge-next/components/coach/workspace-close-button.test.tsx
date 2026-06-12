import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceCloseButton } from "@/components/coach/workspace-close-button";

describe("WorkspaceCloseButton", () => {
  it("renders a bordered secondary icon button", () => {
    render(<WorkspaceCloseButton onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Close workspace" });
    expect(button.className).toContain("border-glass-border");
  });

  it("supports a custom aria label", () => {
    render(
      <WorkspaceCloseButton ariaLabel="Close artifact" onClick={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Close artifact" })).toBeInTheDocument();
  });
});
