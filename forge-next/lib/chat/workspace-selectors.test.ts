import { describe, expect, it } from "vitest";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import {
  canSendChat,
  canStopChat,
  isAwaitingFirstArtifact,
  isChatRunning,
} from "@/lib/chat/workspace-selectors";

describe("workspace selectors", () => {
  it("blocks send while initializing", () => {
    const state = {
      ...createInitialChatWorkspaceState(),
      phase: "initializing" as const,
    };
    expect(canSendChat(state)).toBe(false);
    expect(isChatRunning(state)).toBe(true);
  });

  it("blocks send while streaming", () => {
    const state = { ...createInitialChatWorkspaceState(), phase: "streaming" as const };
    expect(canSendChat(state)).toBe(false);
    expect(isChatRunning(state)).toBe(true);
    expect(canStopChat(state)).toBe(true);
  });

  it("does not allow stop while initializing", () => {
    const state = {
      ...createInitialChatWorkspaceState(),
      phase: "initializing" as const,
    };
    expect(canStopChat(state)).toBe(false);
  });

  it("detects awaiting first artifact", () => {
    const state = {
      ...createInitialChatWorkspaceState(),
      hasStarted: true,
      phase: "streaming" as const,
      runStatus: "generating" as const,
    };
    expect(isAwaitingFirstArtifact(state)).toBe(true);
  });

  it("stops awaiting once an artifact exists", () => {
    const state = {
      ...createInitialChatWorkspaceState(),
      hasStarted: true,
      phase: "streaming" as const,
      currentArtifact: {
        schemaVersion: "3.0.0" as const,
        name: "Block",
        weeks: [],
      },
    };
    expect(isAwaitingFirstArtifact(state)).toBe(false);
  });
});
