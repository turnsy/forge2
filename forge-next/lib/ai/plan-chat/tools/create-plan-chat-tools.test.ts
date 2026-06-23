import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_UPLOAD_READ_MAX_CHARS } from "@/lib/ai/plan-chat/constants";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";

const mockList = vi.fn();
const mockLoad = vi.fn();
const mockRunSandbox = vi.fn();

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
    mockRunSandbox.mockReset();
  });

  it("lists paths under the session prefix", async () => {
    mockList.mockResolvedValue([
      { path: "c/s/a__summary.txt", name: "a__summary.txt", sizeBytes: 1 },
      { path: "c/s/a__volume.txt", name: "a__volume.txt", sizeBytes: 2 },
    ]);

    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      currentArtifact: null,
      onPlanArtifactReady: () => {},
    });

    const result = await tools.list_session_files.execute!({}, toolCtx);

    expect(result.paths).toEqual(["c/s/a__summary.txt", "c/s/a__volume.txt"]);
  });

  it("runs sandbox on submit_plan_code and returns ok when valid", async () => {
    const plan = buildMinimalWorkoutPlan();
    mockRunSandbox.mockResolvedValue({ ok: true, plan });
    const onPlanArtifactReady = vi.fn();
    const onRunStatus = vi.fn();

    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      currentArtifact: null,
      runSandbox: mockRunSandbox,
      onRunStatus,
      onPlanArtifactReady,
    });

    const result = await tools.submit_plan_code.execute!(
      { python: "print('hi')" },
      toolCtx,
    );

    expect(result).toEqual({ ok: true });
    expect(mockRunSandbox).toHaveBeenCalledWith({
      artifact: {
        type: "plan",
        currentPlan: null,
        generatedPython: "print('hi')",
      },
    });
    expect(onRunStatus).toHaveBeenCalledWith("sandbox");
    expect(onRunStatus).toHaveBeenCalledWith("validating");
    expect(onPlanArtifactReady).toHaveBeenCalledWith(plan);
  });

  it("returns errors when sandbox fails", async () => {
    mockRunSandbox.mockResolvedValue({
      ok: false,
      code: "SANDBOX_FAILED",
      message: "SyntaxError",
    });
    const onSubmitPlanCodeFailed = vi.fn();

    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      currentArtifact: null,
      runSandbox: mockRunSandbox,
      onPlanArtifactReady: () => {},
      onSubmitPlanCodeFailed,
    });

    const result = await tools.submit_plan_code.execute!(
      { python: "bad(" },
      toolCtx,
    );

    expect(result).toEqual({
      ok: false,
      errors: [{ code: "SANDBOX_FAILED", message: "SyntaxError" }],
    });
    expect(onSubmitPlanCodeFailed).toHaveBeenCalledWith([
      { code: "SANDBOX_FAILED", message: "SyntaxError" },
    ]);
  });

  it("read_session_file returns file content", async () => {
    mockLoad.mockResolvedValue("exercise,sets\nsquat,5");
    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      currentArtifact: null,
      onPlanArtifactReady: () => {},
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
      currentArtifact: null,
      onPlanArtifactReady: () => {},
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

  it("read_session_file returns FILE_NOT_FOUND when load fails", async () => {
    mockLoad.mockResolvedValue(null);
    const tools = createPlanChatTools({
      coachId: "c",
      sessionId: "s",
      currentArtifact: null,
      onPlanArtifactReady: () => {},
    });

    const result = await tools.read_session_file.execute!(
      { path: "c/s/missing.txt" },
      toolCtx,
    );

    expect(result).toEqual({ ok: false, error: "FILE_NOT_FOUND" });
  });
});
