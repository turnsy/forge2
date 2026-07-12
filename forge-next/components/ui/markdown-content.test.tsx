import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "@/components/ui/markdown-content";

describe("MarkdownContent", () => {
  it("renders markdown lists and emphasis", () => {
    render(
      <MarkdownContent
        content={"Here is a list:\n\n- First item\n- **Second item**"}
      />,
    );

    expect(screen.getByText("Here is a list:")).toBeInTheDocument();
    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item").tagName).toBe("STRONG");
  });

  it("renders inline code", () => {
    render(<MarkdownContent content="Use `loadWorkoutPlan()` in the builder." />);

    expect(screen.getByText("loadWorkoutPlan()")).toBeInTheDocument();
  });
});
