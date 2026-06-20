"use client";

import { useEffect, useMemo } from "react";
import { saveSessionSnapshot } from "@/lib/chat/actions";
import { useChatWorkspace } from "@/lib/chat/use-chat-workspace";
import {
  createEditPlanWorkspaceState,
  createSessionWorkspaceState,
} from "@/lib/chat/adapters/plan/initial-state";
import { streamPlanChat } from "@/lib/chat/adapters/plan/plan-chat-client";
import { uploadContextFile } from "@/lib/chat/adapters/plan/upload-context-client";
import { validateClientFiles } from "@/lib/chat/adapters/plan/validate-client-files";
import { buildSnapshotFromState } from "@/lib/chat/session-storage";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function useCoachPlanWorkspace(options?: {
  initialPlan?: WorkoutPlan;
  planId?: string;
  initialSession?: { id: string; snapshot: ChatSessionSnapshot };
  onArtifactCleared?: () => void;
}) {
  const initialPlan = options?.initialPlan;
  const planId = options?.planId;
  const initialSession = options?.initialSession;
  const onArtifactCleared = options?.onArtifactCleared;
  const initialState = useMemo(
    () => {
      if (initialPlan && planId) {
        return createEditPlanWorkspaceState(initialPlan, planId);
      }

      if (initialSession) {
        return createSessionWorkspaceState(initialSession);
      }

      return undefined;
    },
    [initialPlan, planId, initialSession],
  );

  const workspace = useChatWorkspace<WorkoutPlan>(
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
      onSaveSnapshot: async (state) => {
        const snapshot = buildSnapshotFromState(state);
        if (snapshot.messages.length === 0) {
          return;
        }

        await saveSessionSnapshot(state.sessionId, snapshot);
      },
    },
    { initialState },
  );

  const { state } = workspace;

  useEffect(() => {
    const persistOnUnload = () => {
      if (state.messages.length === 0) {
        return;
      }

      const snapshot = buildSnapshotFromState(state);
      const payload = JSON.stringify({
        sessionId: state.sessionId,
        snapshot,
      });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/coach/save-session", blob);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistOnUnload();
      }
    };

    window.addEventListener("beforeunload", persistOnUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", persistOnUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state]);

  return workspace;
}

export type { PlanWorkspaceState };
