/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/ui/modal";

describe("Modal", () => {
  it("renders title, body, and footer in a flex column dialog", () => {
    render(
      <Modal
        open
        title="Assign plan"
        onClose={vi.fn()}
        footer={<button type="button">Confirm</button>}
      >
        <p>Pick athletes</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "Assign plan" })).toBeInTheDocument();
    expect(screen.getByText("Pick athletes")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.queryByText("Prompt")).not.toBeInTheDocument();
  });
});
