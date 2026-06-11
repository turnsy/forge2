import { describe, expect, it, vi } from "vitest";
import { runPlanChat } from "@/lib/ai/plan-chat/orchestrator";
import { buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";

const mockGetPlan = vi.fn();
const mockListAthletes = vi.fn();
const mockAssign = vi.fn();

vi.mock("@/lib/plans/repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plans/repository")>();
  return {
    ...actual,
    getCoachPlanById: (...args: unknown[]) => mockGetPlan(...args),
    listCoachPlans: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
    }),
    listCoachPlanVersions: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/lib/athletes/repository", () => ({
  listCoachAthletes: (...args: unknown[]) => mockListAthletes(...args),
}));

vi.mock("@/lib/links/repository", () => ({
  getCoachAthleteRelationship: vi.fn(),
  listCoachPendingInvites: vi.fn().mockResolvedValue([]),
  acceptCoachLink: vi.fn(),
  rejectCoachLink: vi.fn(),
}));

vi.mock("@/lib/plans/mutations", () => ({
  assignPlanToAthletes: (...args: unknown[]) => mockAssign(...args),
}));

vi.mock("@/lib/uploads/list-session-uploads", () => ({
  listSessionUploads: vi.fn().mockResolvedValue([]),
}));

type ToolExecuteContext = { messages: unknown[]; toolCallId: string };

type ToolExecute = (
  input: unknown,
  context: ToolExecuteContext,
) => Promise<unknown>;

function mockStreamTextWithTools(
  runTools: (tools: Record<string, { execute?: ToolExecute }>) => Promise<void>,
) {
  return (opts: { tools: Record<string, { execute?: ToolExecute }> }) => ({
    textStream: (async function* () {
      yield "";
    })(),
    then(resolve: (value: unknown) => void) {
      void runTools(opts.tools).then(() => resolve({}));
      return Promise.resolve();
    },
    tools: opts.tools,
  });
}

const toolCtx: ToolExecuteContext = { messages: [], toolCallId: "test" };

describe("coach agent integration", () => {
  it("set_current_artifact emits setArtifact without returning plan blob to tools", async () => {
    const plan = buildMinimalWorkoutPlan("Loaded Plan");
    mockGetPlan.mockResolvedValue({
      status: "ok",
      detail: {
        id: "plan-1",
        createdAt: "2026-01-01T00:00:00Z",
        plan,
      },
    });

    const events: unknown[] = [];

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: 'Edit @Summer Block {"kind":"plan","id":"plan-1"}',
        messages: [],
        currentArtifact: null,
        emit: (event) => events.push(event),
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        streamTextFn: mockStreamTextWithTools(async (tools) => {
          const result = await tools.set_current_artifact!.execute!(
            { planId: "00000000-0000-4000-8000-000000000001" },
            toolCtx,
          );
          expect(result).toMatchObject({
            ok: true,
            planId: "plan-1",
            name: "Loaded Plan",
          });
          if ("summary" in result && result.ok) {
            expect(result.summary).not.toContain('"weeks"');
          }
        }),
      },
    );

    expect(events).toContainEqual({
      type: "setArtifact",
      planId: "plan-1",
      plan,
      title: "Loaded Plan",
    });
  });

  it("summarize_current_artifact reads in-preview plan from orchestrator context", async () => {
    const plan = buildMinimalWorkoutPlan("Draft Plan");

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: "What is in the current plan?",
        messages: [],
        currentArtifact: plan,
        emit: () => {},
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        streamTextFn: mockStreamTextWithTools(async (tools) => {
          const result = await tools.summarize_current_artifact!.execute!(
            {},
            toolCtx,
          );
          expect(result.summary).toContain("Draft Plan");
        }),
      },
    );
  });

  it("list_athletes passes search query to repository", async () => {
    mockListAthletes.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
    });

    await runPlanChat(
      {
        coachId: "coach-1",
        sessionId: "session-1",
        prompt: "Who is Jane?",
        messages: [],
        currentArtifact: null,
        emit: () => {},
      },
      {
        isGatewayConfigured: () => true,
        createModel: () => ({}) as never,
        streamTextFn: mockStreamTextWithTools(async (tools) => {
          await tools.list_athletes!.execute!({ q: "Jane" }, toolCtx);
        }),
      },
    );

    expect(mockListAthletes).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Jane" }),
    );
  });
});
