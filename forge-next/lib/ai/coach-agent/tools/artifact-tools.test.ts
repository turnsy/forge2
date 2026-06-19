import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPlan = vi.fn();
const mockGetAssignment = vi.fn();

vi.mock("@/lib/plans/repository", () => ({
  getCoachPlanById: (...args: unknown[]) => mockGetPlan(...args),
}));

vi.mock("@/lib/athlete/plan/repository", () => ({
  getCoachAthleteActiveAssignment: (...args: unknown[]) =>
    mockGetAssignment(...args),
}));

import { createArtifactTools } from "@/lib/ai/coach-agent/tools/artifact-tools";

const toolCtx = { messages: [], toolCallId: "1" };

const samplePlan = {
  schemaVersion: "2.0.0" as const,
  name: "Summer Block",
  weeks: [
    {
      index: 1,
      days: [
        {
          index: 1,
          code: "w1d1",
          exercises: [
            {
              name: "Squat",
              sets: [
                {
                  id: "w1d1-sq-1",
                  planned: {
                    type: "exact" as const,
                    reps: 5,
                    load: { type: "absolute" as const, value: 100, unit: "kg" as const },
                  },
                  actual: null,
                  status: "planned" as const,
                  locked: false,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const assignedPlan = {
  id: "assignment-1",
  athleteId: "athlete-1",
  coachId: "coach-1",
  status: "active" as const,
  assignedAt: "2026-01-01T00:00:00Z",
  completedAt: null,
  unassignedAt: null,
  planVersionId: null,
  plan: {
    ...samplePlan,
    name: "Jane Block",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Squat",
                sets: [
                  {
                    id: "w1d1-sq-1",
                    planned: {
                      type: "exact" as const,
                      reps: 5,
                      load: {
                        type: "absolute" as const,
                        value: 100,
                        unit: "kg" as const,
                      },
                    },
                    actual: { reps: 5 },
                    status: "completed" as const,
                    locked: true,
                  },
                ],
              },
            ],
          },
          {
            index: 2,
            code: "w1d2",
            exercises: [
              {
                name: "Bench",
                sets: [
                  {
                    id: "w1d2-bn-1",
                    planned: {
                      type: "exact" as const,
                      reps: 5,
                      load: {
                        type: "absolute" as const,
                        value: 80,
                        unit: "kg" as const,
                      },
                    },
                    actual: null,
                    status: "planned" as const,
                    locked: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe("createArtifactTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads plan and returns summary without blob", async () => {
    const onSetCurrentArtifact = vi.fn();
    mockGetPlan.mockResolvedValue({
      status: "ok",
      detail: {
        id: "plan-1",
        createdAt: "2026-01-01T00:00:00Z",
        plan: samplePlan,
      },
    });

    const tools = createArtifactTools({
      coachId: "coach-1",
      onSetCurrentArtifact,
      onClearCurrentArtifact: () => {},
    });
    const result = await tools.set_current_artifact.execute!(
      { type: "plan", id: "plan-1" },
      toolCtx,
    );

    expect(onSetCurrentArtifact).toHaveBeenCalledWith({
      planId: "plan-1",
      plan: samplePlan,
      title: "Summer Block",
    });
    expect(result).toMatchObject({
      ok: true,
      type: "plan",
      planId: "plan-1",
      name: "Summer Block",
    });
    if ("summary" in result && result.ok) {
      expect(result.summary).toContain("Summer Block");
      expect(result.summary).not.toContain('"weeks"');
    }
  });

  it("loads assignment and returns editability metadata", async () => {
    const onSetCurrentArtifact = vi.fn();
    mockGetAssignment.mockResolvedValue({ ok: true, plan: assignedPlan });

    const tools = createArtifactTools({
      coachId: "coach-1",
      onSetCurrentArtifact,
      onClearCurrentArtifact: () => {},
    });
    const result = await tools.set_current_artifact.execute!(
      { type: "assignment", id: "athlete-1" },
      toolCtx,
    );

    expect(onSetCurrentArtifact).toHaveBeenCalledWith({
      assignmentId: "assignment-1",
      plan: assignedPlan.plan,
      title: "Jane Block",
    });
    expect(result).toMatchObject({
      ok: true,
      type: "assignment",
      assignmentId: "assignment-1",
      athleteId: "athlete-1",
      editableDayCount: 1,
      lockedDayCount: 1,
    });
  });

  it("returns not found when athlete has no active assignment", async () => {
    mockGetAssignment.mockResolvedValue({ ok: true, plan: null });

    const tools = createArtifactTools({
      coachId: "coach-1",
      onSetCurrentArtifact: () => {},
      onClearCurrentArtifact: () => {},
    });
    const result = await tools.set_current_artifact.execute!(
      { type: "assignment", id: "athlete-1" },
      toolCtx,
    );

    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "Active assignment not found.",
    });
  });

  it("clears artifact on clear_current_artifact", async () => {
    const onClearCurrentArtifact = vi.fn();
    const tools = createArtifactTools({
      coachId: "coach-1",
      onSetCurrentArtifact: () => {},
      onClearCurrentArtifact,
    });

    const result = await tools.clear_current_artifact.execute!({}, toolCtx);

    expect(onClearCurrentArtifact).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ok: true,
      message: "Current plan cleared. Ready for a new plan.",
    });
  });
});
