"use client";

import { useChatWorkspace } from "@/lib/chat/use-chat-workspace";
import { streamPlanChat } from "@/lib/plan-chat/plan-chat-client";
import { uploadContextFile } from "@/lib/plan-chat/upload-context-client";
import { validateClientFiles } from "@/lib/plan-chat/validate-client-files";
import type { PlanWorkspaceState } from "@/lib/plan-chat/types";

export function useCoachPlanWorkspace() {
  return useChatWorkspace({
    validateFiles: validateClientFiles,
    uploadFile: uploadContextFile,
    streamChat: async ({ draftId, prompt, messages, currentArtifact, onEvent }) => {
      const error = await streamPlanChat({
        body: {
          draftId,
          prompt,
          messages,
          currentArtifact,
        },
        onEvent,
      });

      if (!error) {
        return null;
      }

      return { message: error.message };
    },
  });
}

export type CoachPlanWorkspaceController = ReturnType<typeof useCoachPlanWorkspace>;

export type { PlanWorkspaceState };
