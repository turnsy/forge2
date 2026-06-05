import { describe, expect, it } from "vitest";
import { createInitialPlanChatWorkspaceState } from "@/lib/plan-chat/initial-state";
import { canSendPlanChat } from "@/lib/plan-chat/workspace-selectors";

describe("canSendPlanChat", () => {
  it("blocks while streaming", () => {
    const state = { ...createInitialPlanChatWorkspaceState(), phase: "streaming" as const };
    expect(canSendPlanChat(state)).toBe(false);
  });

  it("blocks while attachments are uploading", () => {
    const state = {
      ...createInitialPlanChatWorkspaceState(),
      attachments: [
        {
          localId: "1",
          file: new File(["a"], "a.csv"),
          status: "uploading" as const,
          displayLabel: "a.csv",
        },
      ],
    };
    expect(canSendPlanChat(state)).toBe(false);
  });
});
