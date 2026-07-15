import { describe, expect, it } from "vitest";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const samplePlan: WorkoutPlan = {
  schemaVersion: "3.1.0",
  name: "Block",
  weeks: [],
};

describe("chatWorkspaceReducer", () => {
  it("stores mention segments on user messages", () => {
    const state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Edit @Summer Block",
      userSegments: [
        { type: "text", value: "Edit " },
        {
          type: "mention",
          kind: "plan",
          id: "plan-1",
          label: "Summer Block",
        },
      ],
    });

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({
      role: "user",
      content: "Edit @Summer Block",
      segments: [
        { type: "text", value: "Edit " },
        {
          type: "mention",
          kind: "plan",
          id: "plan-1",
          label: "Summer Block",
        },
      ],
    });
  });

  it("commits assistant message on STREAM_END", () => {
    let state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Build a plan",
    });
    state = {
      ...state,
      streamingAssistantText: "Here is your plan.",
      runStatus: "done",
    };
    state = chatWorkspaceReducer(state, { type: "STREAM_END" });
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1]).toEqual({
      role: "assistant",
      content: "Here is your plan.",
    });
    expect(state.streamingAssistantText).toBe("");
    expect(state.phase).toBe("idle");
  });

  it("surfaces an error when the stream ends before runStatus is done", () => {
    let state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Build a full plan from my sheet",
    });
    state = chatWorkspaceReducer(state, {
      type: "APPLY_EVENT",
      event: { type: "runStatus", status: "generating" },
    });

    state = chatWorkspaceReducer(state, { type: "STREAM_END" });

    expect(state.phase).toBe("error");
    expect(state.runStatus).toBe("error");
    expect(state.errors[0]?.code).toBe("STREAM_INTERRUPTED");
    expect(state.errors[0]?.message).toMatch(/stopped before finishing/i);
  });

  it("keeps prior artifact when errors arrive after a valid artifact", () => {
    let state = {
      ...createInitialChatWorkspaceState<WorkoutPlan>(),
      currentArtifact: samplePlan,
    };
    state = chatWorkspaceReducer(state, {
      type: "APPLY_EVENT",
      event: {
        type: "errors",
        errors: [{ path: "/name", message: "Invalid" }],
      },
    });
    expect(state.currentArtifact).toEqual(samplePlan);
  });

  it("stores artifact updates from SET_ARTIFACT", () => {
    const state = chatWorkspaceReducer(
      createInitialChatWorkspaceState<WorkoutPlan>(),
      { type: "SET_ARTIFACT", artifact: samplePlan },
    );

    expect(state.currentArtifact).toEqual(samplePlan);
  });

  it("restarts workspace with a new draft id", () => {
    const state = chatWorkspaceReducer(
      {
        ...createInitialChatWorkspaceState("old-id"),
        hasStarted: true,
        messages: [{ role: "user", content: "Hi" }],
      },
      { type: "RESTART", sessionId: "new-id" },
    );
    expect(state.sessionId).toBe("new-id");
    expect(state.hasStarted).toBe(false);
    expect(state.messages).toHaveLength(0);
  });

  it("restores uploaded attachments from session storage", () => {
    const state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "RESTORE_ATTACHMENTS",
      attachments: [
        {
          localId: "restored-1",
          status: "uploaded",
          displayLabel: "my plan",
          contextFileIds: ["coach/session/my-plan.txt"],
        },
      ],
    });

    expect(state.attachments).toHaveLength(1);
    expect(state.contextFileIds).toEqual(["coach/session/my-plan.txt"]);
  });

  it("skips restore when attachment ids are already present", () => {
    const initial = {
      ...createInitialChatWorkspaceState(),
      contextFileIds: ["coach/session/my-plan.txt"],
      attachments: [
        {
          localId: "existing-1",
          status: "uploaded" as const,
          displayLabel: "my plan",
          contextFileIds: ["coach/session/my-plan.txt"],
        },
      ],
    };

    const state = chatWorkspaceReducer(initial, {
      type: "RESTORE_ATTACHMENTS",
      attachments: [
        {
          localId: "restored-1",
          status: "uploaded",
          displayLabel: "my plan",
          contextFileIds: ["coach/session/my-plan.txt"],
        },
      ],
    });

    expect(state).toBe(initial);
  });

  it("removes an attachment and its context file ids", () => {
    const initial = {
      ...createInitialChatWorkspaceState(),
      contextFileIds: [
        "coach/session/my-plan.txt",
        "coach/session/notes.txt",
      ],
      attachments: [
        {
          localId: "attach-1",
          status: "uploaded" as const,
          displayLabel: "my plan",
          contextFileIds: ["coach/session/my-plan.txt"],
        },
        {
          localId: "attach-2",
          status: "uploaded" as const,
          displayLabel: "notes",
          contextFileIds: ["coach/session/notes.txt"],
        },
      ],
    };

    const state = chatWorkspaceReducer(initial, {
      type: "REMOVE_ATTACHMENT",
      localId: "attach-1",
    });

    expect(state.attachments).toHaveLength(1);
    expect(state.attachments[0]?.localId).toBe("attach-2");
    expect(state.contextFileIds).toEqual(["coach/session/notes.txt"]);
  });

  it("syncs attachments from storage while keeping in-flight uploads", () => {
    const initial = {
      ...createInitialChatWorkspaceState(),
      contextFileIds: ["coach/session/uploading.txt"],
      attachments: [
        {
          localId: "in-flight",
          status: "uploading" as const,
          displayLabel: "draft.csv",
        },
      ],
    };

    const state = chatWorkspaceReducer(initial, {
      type: "SYNC_ATTACHMENTS",
      attachments: [
        {
          localId: "stored-1",
          status: "uploaded",
          displayLabel: "my plan",
          contextFileIds: ["coach/session/my-plan.txt"],
        },
      ],
    });

    expect(state.attachments).toHaveLength(2);
    expect(state.attachments[0]?.localId).toBe("in-flight");
    expect(state.attachments[1]?.localId).toBe("stored-1");
    expect(state.contextFileIds).toEqual(["coach/session/my-plan.txt"]);
  });

  it("ignores upload success for attachments removed while uploading", () => {
    const state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "ATTACH_UPLOAD_SUCCESS",
      localId: "removed",
      contextFileIds: ["coach/session/orphan.txt"],
      displayLabel: "draft.csv",
    });

    expect(state.attachments).toHaveLength(0);
    expect(state.contextFileIds).toHaveLength(0);
  });
});
