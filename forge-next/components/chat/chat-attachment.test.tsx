import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatAttachment } from "@/components/chat/chat-attachment";

describe("ChatAttachment", () => {
  it("calls onRemove when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <ChatAttachment
        attachment={{
          localId: "attach-1",
          status: "uploaded",
          displayLabel: "my plan.csv",
          contextFileIds: ["coach/session/my-plan.txt"],
        }}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove my plan.csv" }));
    expect(onRemove).toHaveBeenCalledWith("attach-1");
  });

  it("hides remove while an attachment is uploading", () => {
    render(
      <ChatAttachment
        attachment={{
          localId: "attach-1",
          status: "uploading",
          displayLabel: "my plan.csv",
        }}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Remove my plan.csv" }),
    ).not.toBeInTheDocument();
  });
});
