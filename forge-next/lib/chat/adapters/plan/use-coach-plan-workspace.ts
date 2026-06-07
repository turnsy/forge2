"use client";

import { useMemo } from "react";
import { useChatWorkspace } from "@/lib/chat/use-chat-workspace";
import { createEditPlanWorkspaceState } from "@/lib/chat/adapters/plan/initial-state";
import { streamPlanChat } from "@/lib/chat/adapters/plan/plan-chat-client";
import { uploadContextFile } from "@/lib/chat/adapters/plan/upload-context-client";
import { validateClientFiles } from "@/lib/chat/adapters/plan/validate-client-files";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function useCoachPlanWorkspace(options?: {
  initialPlan?: WorkoutPlan;
  planId?: string;
  onArtifactCleared?: () => void;
}) {
  const initialPlan = options?.initialPlan;
  const planId = options?.planId;
  const onArtifactCleared = options?.onArtifactCleared;
  const initialState = useMemo(
    () =>
      initialPlan && planId
        ? createEditPlanWorkspaceState(initialPlan, planId)
        : undefined,
    [initialPlan, planId],
  );

  return useChatWorkspace<WorkoutPlan>(
    {
      validateFiles: validateClientFiles,
      uploadFile: uploadContextFile,
      streamChat: async ({
        sessionId,
        prompt,
        messages,
        currentArtifact,
        onEvent,
      }) => {
        const error = await streamPlanChat({
          body: {
            sessionId,
            prompt,
            messages,
            currentArtifact,
          },
          onEvent: (event) => {
            onEvent(event);
            if (event.type === "clearArtifact") {
              onArtifactCleared?.();
            }
          },
        });

        if (!error) {
          return null;
        }

        return { message: error.message };
      },
    },
    { initialState },
  );
}

export type { PlanWorkspaceState };
