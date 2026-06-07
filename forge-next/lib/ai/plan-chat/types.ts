import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanChatRunStatus =
  | "parsing"
  | "generating"
  | "sandbox"
  | "validating"
  | "done"
  | "error";

export type PlanChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PlanChatRequestBody = {
  sessionId: string;
  prompt: string;
  messages?: PlanChatMessage[];
  currentArtifact?: WorkoutPlan | null;
};

export type PlanChatValidationError = {
  path: string;
  message: string;
};

export type PlanChatAssistantTextDeltaEvent = {
  type: "assistantTextDelta";
  delta: string;
};

export type PlanChatRunStatusEvent = {
  type: "runStatus";
  status: PlanChatRunStatus;
};

export type PlanChatArtifactEvent = {
  type: "artifact";
  plan: WorkoutPlan;
};

export type PlanChatWarningsEvent = {
  type: "warnings";
  warnings: string[];
};

export type PlanChatErrorsEvent = {
  type: "errors";
  errors: PlanChatValidationError[] | { code: string; message: string }[];
};

export type PlanChatClearArtifactEvent = {
  type: "clearArtifact";
};

export type PlanChatEvent =
  | PlanChatAssistantTextDeltaEvent
  | PlanChatRunStatusEvent
  | PlanChatArtifactEvent
  | PlanChatWarningsEvent
  | PlanChatErrorsEvent
  | PlanChatClearArtifactEvent;

export type PlanChatEmit = (event: PlanChatEvent) => void;
