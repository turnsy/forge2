import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArtifactToolbar } from "@/components/artifact/artifact-toolbar";

describe("ArtifactToolbar", () => {
  it("renders a page-style header with title input and save button", () => {
    const { container } = render(
      <ArtifactToolbar
        title="Summer block"
        saveDisabled={false}
        onTitleChange={vi.fn()}
      />,
    );
    expect(container.querySelector("header")).toBeTruthy();
    expect(screen.getByLabelText("Artifact title")).toHaveValue("Summer block");
    expect(screen.getByLabelText("Artifact title")).toHaveClass("glass-surface");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("disables save while chat is running", () => {
    render(
      <ArtifactToolbar title="" saveDisabled onTitleChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("calls onTitleChange when typing", async () => {
    const user = userEvent.setup();
    const onTitleChange = vi.fn();
    render(
      <ArtifactToolbar
        title=""
        saveDisabled={false}
        onTitleChange={onTitleChange}
      />,
    );
    await user.type(screen.getByLabelText("Artifact title"), "A");
    expect(onTitleChange).toHaveBeenCalled();
  });
});
