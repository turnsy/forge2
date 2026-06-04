import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const mockLoad = vi.fn();

vi.mock("@/lib/uploads/list-draft-uploads", () => ({
  listDraftUploads: (...args: unknown[]) => mockList(...args),
}));

vi.mock("@/lib/uploads/context-storage", () => ({
  loadUploadContextById: (...args: unknown[]) => mockLoad(...args),
}));

import { createPlanChatTools } from "@/lib/ai/plan-chat/tools/create-plan-chat-tools";

describe("createPlanChatTools", () => {
  beforeEach(() => {
    mockList.mockReset();
    mockLoad.mockReset();
  });

  it("lists multi-sheet draft files", async () => {
    mockList.mockResolvedValue([
      { path: "c/d/a__summary.txt", name: "a__summary.txt", sizeBytes: 1 },
      { path: "c/d/a__volume.txt", name: "a__volume.txt", sizeBytes: 2 },
    ]);

    const tools = createPlanChatTools({
      coachId: "c",
      draftId: "d",
      onSubmitPlanCode: () => {},
    });

    const result = await tools.list_draft_files.execute!(
      {},
      { messages: [], toolCallId: "1" },
    );

    expect(result.files).toHaveLength(2);
  });

  it("captures python on submit_plan_code", async () => {
    let captured = "";
    const tools = createPlanChatTools({
      coachId: "c",
      onSubmitPlanCode: (python) => {
        captured = python;
      },
    });

    await tools.submit_plan_code.execute!(
      { python: "print('hi')" },
      { messages: [], toolCallId: "2" },
    );

    expect(captured).toBe("print('hi')");
    const listed = await tools.list_draft_files.execute!({}, { messages: [], toolCallId: "3" });
    expect(listed.files).toEqual([]);
  });
});
