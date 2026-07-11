import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TurnActivityIndicator } from "@/components/chat/turn-activity-indicator";

describe("TurnActivityIndicator", () => {
  it("renders a compact spinner with visible status text", () => {
    render(<TurnActivityIndicator label="Generating" />);

    expect(screen.getByLabelText("Generating")).toBeInTheDocument();
    expect(screen.getByText("Generating")).toBeInTheDocument();
  });
});
