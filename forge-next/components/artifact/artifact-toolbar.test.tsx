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

  it("shows saving and saved states", () => {
    const { rerender } = render(
      <ArtifactToolbar
        title="Plan"
        saveDisabled={false}
        saveStatus="saving"
        onTitleChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    rerender(
      <ArtifactToolbar
        title="Plan"
        saveDisabled={false}
        saveStatus="saved"
        onTitleChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled();
  });

  it("calls onSave when save is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ArtifactToolbar
        title="Plan"
        saveDisabled={false}
        onTitleChange={vi.fn()}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
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

  it("renders a close control beside save when onClose is provided", () => {
    const onClose = vi.fn();
    render(
      <ArtifactToolbar
        title="Plan"
        saveDisabled={false}
        onTitleChange={vi.fn()}
        onClose={onClose}
      />,
    );

    const saveButton = screen.getByRole("button", { name: "Save" });
    const closeButton = screen.getByRole("button", { name: "Close artifact" });
    expect(saveButton.parentElement).toBe(closeButton.parentElement);
  });
});
