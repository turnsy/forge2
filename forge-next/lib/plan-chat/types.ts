import type {
  PlanChatMessage,
  PlanChatRunStatus,
} from "@/lib/ai/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanChatWorkspacePhase = "idle" | "uploading" | "streaming" | "error";

export type PlanChatDisplayError = {
  code?: string;
  path?: string;
  message: string;
};

export type PlanChatAttachmentStatus = "pending" | "uploading" | "uploaded" | "failed";

export type PlanChatAttachment = {
  localId: string;
  file: File;
  status: PlanChatAttachmentStatus;
  contextFileIds?: string[];
  displayLabel: string;
  errorMessage?: string;
};

export type PlanChatWorkspaceState = {
  draftId: string;
  hasStarted: boolean;
  messages: PlanChatMessage[];
  currentArtifact: WorkoutPlan | null;
  contextFileIds: string[];
  attachments: PlanChatAttachment[];
  runStatus: PlanChatRunStatus | null;
  warnings: string[];
  errors: PlanChatDisplayError[];
  phase: PlanChatWorkspacePhase;
  streamingAssistantText: string;
};

export type PlanChatWorkspaceAction =
  | { type: "RESTART"; draftId: string }
  | { type: "ATTACH_FILES"; attachments: PlanChatAttachment[] }
  | { type: "ATTACH_UPLOAD_START"; localIds: string[] }
  | {
      type: "ATTACH_UPLOAD_SUCCESS";
      localId: string;
      contextFileIds: string[];
      displayLabel: string;
    }
  | { type: "ATTACH_UPLOAD_FAILURE"; localId: string; errorMessage: string }
  | { type: "SEND_START"; userMessage: string }
  | { type: "APPLY_EVENT"; event: import("@/lib/ai/plan-chat/types").PlanChatEvent }
  | { type: "STREAM_END" }
  | { type: "STREAM_CLIENT_ERROR"; message: string };
