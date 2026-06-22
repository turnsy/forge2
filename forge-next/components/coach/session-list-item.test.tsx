import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionListItem } from "@/components/coach/session-list-item";

const mockRenameTaskSession = vi.fn();
const mockDeleteTaskSession = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  renameTaskSession: (...args: unknown[]) => mockRenameTaskSession(...args),
  deleteTaskSession: (...args: unknown[]) => mockDeleteTaskSession(...args),
}));

describe("SessionListItem", () => {
  const session = { id: "session-1", title: "Build a strength block" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRenameTaskSession.mockResolvedValue({ ok: true });
    mockDeleteTaskSession.mockResolvedValue({ ok: true });
  });

  it("renders the conversation title", () => {
    render(
      <SessionListItem
        session={session}
        onOpen={vi.fn()}
        onRenamed={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.getByText("Build a strength block")).toBeInTheDocument();
  });

  it("opens the dropdown and calls onOpen", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <SessionListItem
        session={session}
        onOpen={onOpen}
        onRenamed={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Conversation actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Open" }));

    expect(onOpen).toHaveBeenCalledWith("session-1");
  });

  it("supports inline rename and save", async () => {
    const user = userEvent.setup();
    const onRenamed = vi.fn();

    render(
      <SessionListItem
        session={session}
        onOpen={vi.fn()}
        onRenamed={onRenamed}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Conversation actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    const input = screen.getByLabelText("Conversation title");
    await user.clear(input);
    await user.type(input, "Updated title");
    await user.click(screen.getByRole("button", { name: "Save title" }));

    expect(mockRenameTaskSession).toHaveBeenCalledWith(
      "session-1",
      "Updated title",
    );
    expect(onRenamed).toHaveBeenCalledWith("session-1", "Updated title");
  });

  it("reverts rename on Escape", async () => {
    const user = userEvent.setup();

    render(
      <SessionListItem
        session={session}
        onOpen={vi.fn()}
        onRenamed={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Conversation actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    const input = screen.getByLabelText("Conversation title");
    await user.clear(input);
    await user.type(input, "Changed");
    await user.keyboard("{Escape}");

    expect(screen.getByText("Build a strength block")).toBeInTheDocument();
    expect(mockRenameTaskSession).not.toHaveBeenCalled();
  });

  it("renders delete in red in the dropdown", async () => {
    const user = userEvent.setup();

    render(
      <SessionListItem
        session={session}
        onOpen={vi.fn()}
        onRenamed={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Conversation actions" }));

    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveClass(
      "text-danger",
    );
  });

  it("calls onDeleted when delete is selected", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();

    render(
      <SessionListItem
        session={session}
        onOpen={vi.fn()}
        onRenamed={vi.fn()}
        onDeleted={onDeleted}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Conversation actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(mockDeleteTaskSession).toHaveBeenCalledWith("session-1");
    expect(onDeleted).toHaveBeenCalledWith("session-1");
  });

  it("shows the actions menu on mobile rows", () => {
    render(
      <SessionListItem
        session={session}
        variant="mobile"
        onOpen={vi.fn()}
        onRenamed={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Conversation actions" }),
    ).toBeVisible();
  });

  it("still notifies onOpen for the active session", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <SessionListItem
        session={session}
        isActive
        onOpen={onOpen}
        onRenamed={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Build a strength block"));

    expect(onOpen).toHaveBeenCalledWith("session-1");
  });
});
