import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoPlanAssignedView } from "@/components/no-plan-assigned-view";

describe("NoPlanAssignedView", () => {
  it("renders the no-plan message", () => {
    render(<NoPlanAssignedView />);

    expect(
      screen.getByText(
        "No plan assigned yet. Your coach will assign one here.",
      ),
    ).toBeInTheDocument();
  });
});
