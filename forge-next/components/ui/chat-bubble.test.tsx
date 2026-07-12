import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatBubble, chatBubbleClass } from "@/components/ui/chat-bubble";

describe("ChatBubble", () => {
  it("styles user and assistant bubbles without glass surfaces", () => {
    expect(chatBubbleClass("user")).toContain("bg-coach/14");
    expect(chatBubbleClass("user")).not.toContain("bg-glass");
    expect(chatBubbleClass("assistant")).toContain("bg-[#131315]");
    expect(chatBubbleClass("assistant")).not.toContain("bg-glass");
  });

  it("renders bubble content", () => {
    render(<ChatBubble role="user">Hello coach</ChatBubble>);
    expect(screen.getByText("Hello coach")).toBeInTheDocument();
  });
});
