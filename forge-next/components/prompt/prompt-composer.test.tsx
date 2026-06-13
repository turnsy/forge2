import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromptComposer } from "@/components/prompt/prompt-composer";

const mockUseIsMobile = vi.fn(() => false);

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const athletesResponse = {
  items: [
    { id: "a1", name: "Jane Smith", email: "", currentPlanId: null, currentPlanName: null, completionPercent: null, joinedAt: "" },
    { id: "a2", name: "John Adams", email: "", currentPlanId: null, currentPlanName: null, completionPercent: null, joinedAt: "" },
    { id: "a3", name: "Jamie Lee", email: "", currentPlanId: null, currentPlanName: null, completionPercent: null, joinedAt: "" },
  ],
  total: 3,
  page: 1,
  limit: 4,
  hasMore: false,
};

const plansResponse = {
  items: [
    { id: "p1", title: "Summer Block", weekCount: 4, createdAt: "" },
    { id: "p2", title: "Winter Base", weekCount: 8, createdAt: "" },
  ],
  total: 2,
  page: 1,
  limit: 4,
  hasMore: false,
};

function mockMentionFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/coach/athletes")) {
        return new Response(JSON.stringify(athletesResponse), { status: 200 });
      }

      if (url.includes("/api/coach/plans")) {
        return new Response(JSON.stringify(plansResponse), { status: 200 });
      }

      return new Response(null, { status: 404 });
    }),
  );
}

describe("PromptComposer", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
    mockMentionFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the mention menu when @ is typed", async () => {
    const user = userEvent.setup();
    render(<PromptComposer placeholder="Ask Forge..." />);

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@");

    await waitFor(() => {
      expect(
        screen.getByRole("listbox", { name: /Mention suggestions/i }),
      ).toBeInTheDocument();
    });
  });

  it("never shows more than four mention options", async () => {
    const user = userEvent.setup();
    render(<PromptComposer placeholder="Ask Forge..." />);

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@");

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(4);
    });
  });

  it("inserts a mention chip when an option is selected", async () => {
    const user = userEvent.setup();
    render(<PromptComposer placeholder="Ask Forge..." />);

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@ja");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Jane Smith/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: /Jane Smith/i }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editor).toHaveTextContent("Jane Smith");
    expect(editor.querySelector("[data-mention-id='a1']")).toBeTruthy();
  });

  it("keeps the menu open when space is typed in the query", async () => {
    const user = userEvent.setup();
    render(<PromptComposer placeholder="Ask Forge..." />);

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@jane ");

    await waitFor(() => {
      expect(
        screen.getByRole("listbox", { name: /Mention suggestions/i }),
      ).toBeInTheDocument();
    });
    expect(editor.querySelector("[data-mention-id]")).toBeNull();
  });

  it("closes the menu on Escape", async () => {
    const user = userEvent.setup();
    render(<PromptComposer placeholder="Ask Forge..." />);

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@jane{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
    expect(editor).toHaveTextContent("@jane");
  });

  it("does not open the mention menu on mobile", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    render(<PromptComposer placeholder="Ask Forge..." />);

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@jane");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
    expect(editor).toHaveTextContent("@jane");
  });

  it("selects a mention with Enter instead of sending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(<PromptComposer placeholder="Ask Forge..." onSend={onSend} />);

    const editor = screen.getByRole("textbox");
    await user.click(editor);
    await user.type(editor, "@jane");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Jane Smith/i })).toBeInTheDocument();
    });

    await user.keyboard("{Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(editor.querySelector("[data-mention-id='a1']")).toBeTruthy();
  });
});
