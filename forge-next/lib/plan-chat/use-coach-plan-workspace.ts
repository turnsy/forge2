"use client";

import { useChatWorkspace } from "@/lib/chat/use-chat-workspace";
import { streamPlanChat } from "@/lib/plan-chat/plan-chat-client";
import { uploadContextFile } from "@/lib/plan-chat/upload-context-client";
import { validateClientFiles } from "@/lib/plan-chat/validate-client-files";
import type { PlanWorkspaceState } from "@/lib/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function useCoachPlanWorkspace() {
  return useChatWorkspace<WorkoutPlan>({
    validateFiles: validateClientFiles,
    uploadFile: uploadContextFile,
    streamChat: async ({ sessionId, prompt, messages, currentArtifact, onEvent }) => {
      const error = await streamPlanChat({
        body: {
          sessionId,
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

export type { PlanWorkspaceState };
