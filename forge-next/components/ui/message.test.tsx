import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Message } from "@/components/ui/message";

describe("Message", () => {
  it("uses alert role for error tone", () => {
    render(<Message tone="error">Something went wrong</Message>);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("uses status role for info tone", () => {
    render(<Message tone="info">Heads up</Message>);

    expect(screen.getByRole("status")).toHaveTextContent("Heads up");
  });

  it("uses status role for success tone", () => {
    render(<Message tone="success">All set</Message>);

    expect(screen.getByRole("status")).toHaveTextContent("All set");
  });
});
