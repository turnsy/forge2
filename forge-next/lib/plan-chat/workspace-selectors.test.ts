import { describe, expect, it } from "vitest";
import { createInitialPlanChatWorkspaceState } from "@/lib/plan-chat/initial-state";
import {
  canSendPlanChat,
  isAwaitingFirstPlan,
  isChatRunning,
} from "@/lib/plan-chat/workspace-selectors";

describe("workspace selectors", () => {
  it("blocks send while streaming", () => {
    const state = { ...createInitialPlanChatWorkspaceState(), phase: "streaming" as const };
    expect(canSendPlanChat(state)).toBe(false);
    expect(isChatRunning(state)).toBe(true);
  });

  it("detects awaiting first plan", () => {
    const state = {
      ...createInitialPlanChatWorkspaceState(),
      hasStarted: true,
      phase: "streaming" as const,
      runStatus: "generating" as const,
    };
    expect(isAwaitingFirstPlan(state)).toBe(true);
  });

  it("stops awaiting once an artifact exists", () => {
    const state = {
      ...createInitialPlanChatWorkspaceState(),
      hasStarted: true,
      phase: "streaming" as const,
      currentArtifact: {
        schemaVersion: "2.0.0" as const,
        name: "Block",
        weeks: [],
      },
    };
    expect(isAwaitingFirstPlan(state)).toBe(false);
  });
});
