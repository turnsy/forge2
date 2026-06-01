import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorState } from "@/components/ui/error-state";

describe("ErrorState", () => {
  it("renders title and description", () => {
    render(
      <ErrorState title="Something failed" description="Try again later." />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something failed");
    expect(screen.getByRole("alert")).toHaveTextContent("Try again later.");
  });

  it("renders optional details", () => {
    render(
      <ErrorState
        title="Validation failed"
        details={<ul data-testid="details"><li>/name: required</li></ul>}
      />,
    );

    expect(screen.getByTestId("details")).toBeInTheDocument();
  });
});
