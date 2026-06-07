import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessageBody } from "@/components/chat/chat-message-body";

describe("ChatMessageBody", () => {
  it("renders mention chips for user messages with segments", () => {
    render(
      <ChatMessageBody
        message={{
          role: "user",
          content: "How many weeks is @1 Week General Strength ?",
          segments: [
            { type: "text", value: "How many weeks is " },
            {
              type: "mention",
              kind: "plan",
              id: "plan-1",
              label: "1 Week General Strength",
            },
            { type: "text", value: " ?" },
          ],
        }}
      />,
    );

    expect(screen.getByText("1 Week General Strength")).toBeInTheDocument();
    expect(screen.getByText("1 Week General Strength").closest("[data-mention-kind]")).toHaveAttribute(
      "data-mention-kind",
      "plan",
    );
  });

  it("renders plain text for assistant messages", () => {
    render(
      <ChatMessageBody
        message={{
          role: "assistant",
          content: "The plan is 1 week long.",
        }}
      />,
    );

    expect(screen.getByText("The plan is 1 week long.")).toBeInTheDocument();
  });
});
