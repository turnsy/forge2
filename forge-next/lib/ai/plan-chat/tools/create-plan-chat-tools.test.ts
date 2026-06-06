import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const mockLoad = vi.fn();

vi.mock("@/lib/uploads/list-session-uploads", () => ({
  listSessionUploads: (...args: unknown[]) => mockList(...args),
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

  it("lists paths under the session prefix", async () => {
    mockList.mockResolvedValue([
      { path: "c/s/a__summary.txt", name: "a__summary.txt", sizeBytes: 1 },
      { path: "c/s/a__volume.txt", name: "a__volume.txt", sizeBytes: 2 },
    ]);

    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      onSubmitPlanCode: () => {},
    });

    const result = await tools.list_session_files.execute!(
      {},
      { messages: [], toolCallId: "1" },
    );

    expect(result.paths).toEqual(["c/s/a__summary.txt", "c/s/a__volume.txt"]);
  });

  it("captures python on submit_plan_code", async () => {
    let captured = "";
    mockList.mockResolvedValue([]);
    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      onSubmitPlanCode: (python) => {
        captured = python;
      },
    });

    await tools.submit_plan_code.execute!(
      { python: "print('hi')" },
      { messages: [], toolCallId: "2" },
    );

    expect(captured).toBe("print('hi')");

    const listed = await tools.list_session_files.execute!(
      {},
      { messages: [], toolCallId: "3" },
    );
    expect(listed.paths).toEqual([]);
  });
});
