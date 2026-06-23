import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeXlsxBuffer } from "@/lib/uploads/__tests__/fixtures";
import { uploadFileSlug } from "@/lib/uploads/file-utils";

const mockSaveUploadContext = vi.fn();
const mockLoadUploadContextById = vi.fn();
const mockListSessionUploads = vi.fn();

vi.mock("@/lib/uploads/context-storage", () => ({
  saveUploadContext: (...args: unknown[]) => mockSaveUploadContext(...args),
  loadUploadContextById: (...args: unknown[]) => mockLoadUploadContextById(...args),
}));

vi.mock("@/lib/uploads/list-session-uploads", () => ({
  listSessionUploads: (...args: unknown[]) => mockListSessionUploads(...args),
}));

import { normalizeMessageUploads } from "@/lib/uploads/normalize-message-uploads";
import { runPlanChat } from "@/lib/ai/plan-chat/orchestrator";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";

type ToolExecuteContext = { messages: unknown[]; toolCallId: string };

type PlanChatTools = {
  list_session_files: {
    execute: (input: object, ctx: ToolExecuteContext) => Promise<{ paths: string[] }>;
  };
  read_session_file: {
    execute: (
      input: { path: string },
      ctx: ToolExecuteContext,
    ) => Promise<unknown>;
  };
  submit_plan_code: {
    execute: (
      input: { python: string },
      ctx: ToolExecuteContext,
    ) => Promise<unknown>;
  };
};

function mockStreamTextWithTools(
  runTools: (tools: PlanChatTools) => Promise<void>,
  text = "",
) {
  return (opts: { tools: PlanChatTools }) => ({
    textStream: (async function* () {
      if (text.length > 0) {
        yield text;
      }
    })(),
    then(resolve: (value: unknown) => void) {
      return runTools(opts.tools).then(() => resolve({}));
    },
    tools: opts.tools,
  });
}

const toolCtx: ToolExecuteContext = { messages: [], toolCallId: "test" };

describe("plan generation integration", () => {
  const coachId = "coach-1";
  const sessionId = "session-1";

  beforeEach(() => {
    mockSaveUploadContext.mockReset();
    mockLoadUploadContextById.mockReset();
    mockListSessionUploads.mockReset();
  });

  async function uploadMultiSheetWorkbook() {
    mockSaveUploadContext
      .mockResolvedValueOnce({
        ok: true,
        contextFileId: `${coachId}/${sessionId}/workbook__summary.txt`,
      })
      .mockResolvedValueOnce({
        ok: true,
        contextFileId: `${coachId}/${sessionId}/workbook__volume.txt`,
      });

    const upload = await normalizeMessageUploads({
      coachId,
      sessionId,
      files: [
        {
          filename: "workbook.xlsx",
          buffer: makeXlsxBuffer({
            Summary: [["exercise", "sets"], ["squat", "5"]],
            Volume: [["exercise", "sets"], ["bench", "3"]],
          }),
        },
      ],
    });

    expect(upload).toMatchObject({ ok: true });
    if (!upload.ok) {
      throw new Error("upload failed");
    }

    expect(upload.contextFileIds).toHaveLength(2);
    expect(mockSaveUploadContext).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: uploadFileSlug("workbook.xlsx", "Summary"),
      }),
    );

    return upload;
  }

  function listItemsFromUpload(contextFileIds: string[]) {
    return contextFileIds.map((path) => ({
      path,
      name: path.split("/").pop() ?? path,
      sizeBytes: 1,
    }));
  }

  it("clarify path: multi-sheet upload then plan-chat without sandbox", async () => {
    const upload = await uploadMultiSheetWorkbook();
    mockListSessionUploads.mockResolvedValue(listItemsFromUpload(upload.contextFileIds));

    const events: { type: string; status?: string }[] = [];
    const runSandbox = vi.fn();

    await runPlanChat(
      {
        coachId,
        sessionId,
        prompt: "Build from my spreadsheet",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        streamTextFn: mockStreamTextWithTools(async (tools) => {
          const listed = await tools.list_session_files.execute({}, toolCtx);
          expect(listed.paths).toEqual(upload.contextFileIds);
          expect(mockListSessionUploads).toHaveBeenCalledWith(coachId, sessionId);
        }, "Which sheet should I use — Summary or Volume?"),
        runSandbox,
      },
    );

    expect(runSandbox).not.toHaveBeenCalled();
    expect(events.some((e) => e.type === "artifact")).toBe(false);
    expect(events.filter((e) => e.type === "runStatus").at(-1)).toEqual({
      type: "runStatus",
      status: "done",
    });
  });

  it("generate path: multi-sheet upload then plan-chat produces artifact", async () => {
    const upload = await uploadMultiSheetWorkbook();
    const summaryPath = upload.contextFileIds[0]!;
    mockLoadUploadContextById.mockResolvedValue("exercise,sets\nsquat,5");
    mockListSessionUploads.mockResolvedValue(listItemsFromUpload(upload.contextFileIds));

    const events: { type: string; status?: string }[] = [];
    const runSandbox = vi.fn().mockResolvedValue({
      ok: true,
      plan: buildMinimalWorkoutPlan("Integrated Plan"),
    });

    await runPlanChat(
      {
        coachId,
        sessionId,
        prompt: "Use the Summary sheet",
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        streamTextFn: mockStreamTextWithTools(async (tools) => {
          await tools.list_session_files.execute({}, toolCtx);
          await tools.read_session_file.execute({ path: summaryPath }, toolCtx);
          await tools.get_plan_codegen_guide.execute({}, toolCtx);
          await tools.submit_plan_code.execute(
            { python: "print('plan')" },
            toolCtx,
          );
        }, "Building your plan."),
        runSandbox,
      },
    );

    expect(mockLoadUploadContextById).toHaveBeenCalledWith(summaryPath, coachId);
    expect(runSandbox).toHaveBeenCalledWith({
      artifact: {
        type: "plan",
        currentPlan: null,
        generatedPython: "print('plan')",
      },
    });

    const statuses = events
      .filter((e) => e.type === "runStatus")
      .map((e) => e.status);
    expect(statuses).toContain("sandbox");
    expect(statuses).toContain("validating");
    expect(statuses.at(-1)).toBe("done");
    expect(events.some((e) => e.type === "artifact")).toBe(true);
  });
});
