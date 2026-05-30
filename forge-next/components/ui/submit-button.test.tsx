import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseFormStatus = vi.fn(() => ({ pending: false }));

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormStatus: () => mockUseFormStatus(),
  };
});

import { SubmitButton } from "@/components/ui/submit-button";

describe("SubmitButton", () => {
  it("shows children when not pending", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });
    render(<SubmitButton>Continue</SubmitButton>);

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("shows pendingLabel and disables when pending", () => {
    mockUseFormStatus.mockReturnValue({ pending: true });
    render(<SubmitButton pendingLabel="Signing in…">Continue</SubmitButton>);

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });

  it("respects disabled prop when not pending", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });
    render(<SubmitButton disabled>Continue</SubmitButton>);

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
