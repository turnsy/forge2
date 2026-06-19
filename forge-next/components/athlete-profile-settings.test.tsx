import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateProfileFullNameAction = vi.fn();
const mockUpdateProfileEmailAction = vi.fn();

vi.mock("@/lib/profile/actions", () => ({
  updateProfileFullNameAction: (...args: unknown[]) =>
    mockUpdateProfileFullNameAction(...args),
  updateProfileEmailAction: (...args: unknown[]) =>
    mockUpdateProfileEmailAction(...args),
}));

import { AthleteProfileSettings } from "@/components/athlete-profile-settings";

describe("AthleteProfileSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfileFullNameAction.mockResolvedValue({ ok: true });
    mockUpdateProfileEmailAction.mockResolvedValue({ ok: true });
  });

  it("saves the full name", async () => {
    const user = userEvent.setup();

    render(
      <AthleteProfileSettings fullName="Athlete One" email="athlete@example.com" />,
    );

    const nameInput = screen.getByLabelText("Full name");
    await user.clear(nameInput);
    await user.type(nameInput, "Alex Rivera");
    await user.click(screen.getByRole("button", { name: "Save name" }));

    expect(mockUpdateProfileFullNameAction).toHaveBeenCalledWith("Alex Rivera");
    expect(screen.getByText("Name saved.")).toBeInTheDocument();
  });

  it("shows name errors from the server action", async () => {
    mockUpdateProfileFullNameAction.mockResolvedValue({
      ok: false,
      code: "validation_error",
      message: "Name is required",
    });
    const user = userEvent.setup();

    render(
      <AthleteProfileSettings fullName="Athlete One" email="athlete@example.com" />,
    );

    await user.click(screen.getByRole("button", { name: "Save name" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("triggers the email confirmation flow", async () => {
    const user = userEvent.setup();

    render(
      <AthleteProfileSettings fullName="Athlete One" email="athlete@example.com" />,
    );

    const emailInput = screen.getByLabelText("Email");
    await user.clear(emailInput);
    await user.type(emailInput, "new@example.com");
    await user.click(screen.getByRole("button", { name: "Update email" }));

    expect(mockUpdateProfileEmailAction).toHaveBeenCalledWith("new@example.com");
    expect(
      screen.getByText("Check your email to confirm the change."),
    ).toBeInTheDocument();
  });

  it("shows email errors from the server action", async () => {
    mockUpdateProfileEmailAction.mockResolvedValue({
      ok: false,
      code: "validation_error",
      message: "Enter a different email address",
    });
    const user = userEvent.setup();

    render(
      <AthleteProfileSettings fullName="Athlete One" email="athlete@example.com" />,
    );

    await user.click(screen.getByRole("button", { name: "Update email" }));

    expect(screen.getByText("Enter a different email address")).toBeInTheDocument();
  });
});
