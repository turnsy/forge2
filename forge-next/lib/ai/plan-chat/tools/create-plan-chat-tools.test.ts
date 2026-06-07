import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_UPLOAD_READ_MAX_CHARS } from "@/lib/ai/plan-chat/constants";

const mockList = vi.fn();
const mockLoad = vi.fn();

vi.mock("@/lib/uploads/list-session-uploads", () => ({
  listSessionUploads: (...args: unknown[]) => mockList(...args),
}));

vi.mock("@/lib/uploads/context-storage", () => ({
  loadUploadContextById: (...args: unknown[]) => mockLoad(...args),
}));

import { createPlanChatTools } from "@/lib/ai/plan-chat/tools/create-plan-chat-tools";

const toolCtx = { messages: [], toolCallId: "1" };

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
      onClearArtifact: () => {},
    });

    const result = await tools.list_session_files.execute!({}, toolCtx);

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
      onClearArtifact: () => {},
    });

    await tools.submit_plan_code.execute!({ python: "print('hi')" }, toolCtx);

    expect(captured).toBe("print('hi')");

    const listed = await tools.list_session_files.execute!({}, toolCtx);
    expect(listed.paths).toEqual([]);
  });

  it("read_session_file returns file content", async () => {
    mockLoad.mockResolvedValue("exercise,sets\nsquat,5");
    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      onSubmitPlanCode: () => {},
      onClearArtifact: () => {},
    });

    const result = await tools.read_session_file.execute!(
      { path: "c/s/plan.txt" },
      toolCtx,
    );

    expect(result).toEqual({
      ok: true,
      path: "c/s/plan.txt",
      content: "exercise,sets\nsquat,5",
      truncated: false,
    });
  });

  it("read_session_file truncates long content", async () => {
    mockLoad.mockResolvedValue("x".repeat(SESSION_UPLOAD_READ_MAX_CHARS + 100));
    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      onSubmitPlanCode: () => {},
      onClearArtifact: () => {},
    });

    const result = await tools.read_session_file.execute!(
      { path: "c/s/big.txt" },
      toolCtx,
    );

    expect(result).toMatchObject({
      ok: true,
      truncated: true,
    });
    if (result.ok) {
      expect(result.content.length).toBeLessThan(SESSION_UPLOAD_READ_MAX_CHARS + 50);
      expect(result.content).toContain("[truncated]");
    }
  });

  it("clears artifact on clear_current_artifact", async () => {
    let cleared = false;
    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      onSubmitPlanCode: () => {},
      onClearArtifact: () => {
        cleared = true;
      },
    });

    const result = await tools.clear_current_artifact.execute!({}, toolCtx);

    expect(cleared).toBe(true);
    expect(result).toEqual({
      ok: true,
      message: "Current plan cleared. Ready for a new plan.",
    });
  });

  it("read_session_file returns FILE_NOT_FOUND when load fails", async () => {
    mockLoad.mockResolvedValue(null);
    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      onSubmitPlanCode: () => {},
      onClearArtifact: () => {},
    });

    const result = await tools.read_session_file.execute!(
      { path: "c/s/missing.txt" },
      toolCtx,
    );

    expect(result).toEqual({ ok: false, error: "FILE_NOT_FOUND" });
  });
});
