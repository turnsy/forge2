import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TurnActivityIndicator } from "@/components/chat/turn-activity-indicator";
import { TURN_ACTIVITY_LABEL } from "@/lib/chat/turn-activity";

describe("TurnActivityIndicator", () => {
  it("renders a compact spinner without visible status text", () => {
    render(<TurnActivityIndicator />);

    expect(screen.getByLabelText(TURN_ACTIVITY_LABEL)).toBeInTheDocument();
    expect(screen.queryByText("Generating")).not.toBeInTheDocument();
  });
});
