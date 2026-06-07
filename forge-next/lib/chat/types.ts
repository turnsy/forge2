export type ChatStatus =
  | "parsing"
  | "generating"
  | "sandbox"
  | "validating"
  | "done"
  | "error";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatWorkspacePhase = "idle" | "uploading" | "streaming" | "error";

export type ChatDisplayError = {
  code?: string;
  path?: string;
  message: string;
};

export type ChatAttachmentStatus = "pending" | "uploading" | "uploaded" | "failed";

export type ChatAttachment = {
  localId: string;
  file: File;
  status: ChatAttachmentStatus;
  contextFileIds?: string[];
  displayLabel: string;
  errorMessage?: string;
};

export type ChatWorkspaceState<TArtifact = unknown> = {
  sessionId: string;
  hasStarted: boolean;
  artifactTitle: string;
  planId: string | null;
  messages: ChatMessage[];
  currentArtifact: TArtifact | null;
  contextFileIds: string[];
  attachments: ChatAttachment[];
  runStatus: ChatStatus | null;
  warnings: string[];
  errors: ChatDisplayError[];
  phase: ChatWorkspacePhase;
  streamingAssistantText: string;
};

export type ChatAssistantTextDeltaEvent = {
  type: "assistantTextDelta";
  delta: string;
};

export type ChatRunStatusEvent = {
  type: "runStatus";
  status: ChatStatus;
};

export type ChatArtifactEvent<TArtifact = unknown> = {
  type: "artifact";
  artifact: TArtifact;
  title?: string;
};

export type ChatSetArtifactEvent<TArtifact = unknown> = {
  type: "setArtifact";
  artifact: TArtifact;
  title: string;
  planId: string;
};

export type ChatWarningsEvent = {
  type: "warnings";
  warnings: string[];
};

export type ChatErrorsEvent = {
  type: "errors";
  errors:
    | { path: string; message: string }[]
    | { code: string; message: string }[];
};

export type ChatEvent<TArtifact = unknown> =
  | ChatAssistantTextDeltaEvent
  | ChatRunStatusEvent
  | ChatArtifactEvent<TArtifact>
  | ChatSetArtifactEvent<TArtifact>
  | ChatWarningsEvent
  | ChatErrorsEvent;

export type ChatWorkspaceAction<TArtifact = unknown> =
  | { type: "RESTART"; sessionId: string }
  | { type: "SET_ARTIFACT_TITLE"; artifactTitle: string }
  | { type: "SET_PLAN_ID"; planId: string }
  | { type: "ATTACH_FILES"; attachments: ChatAttachment[] }
  | { type: "ATTACH_UPLOAD_START"; localIds: string[] }
  | {
      type: "ATTACH_UPLOAD_SUCCESS";
      localId: string;
      contextFileIds: string[];
      displayLabel: string;
    }
  | { type: "ATTACH_UPLOAD_FAILURE"; localId: string; errorMessage: string }
  | { type: "SEND_START"; userMessage: string }
  | { type: "APPLY_EVENT"; event: ChatEvent<TArtifact> }
  | { type: "STREAM_END" }
  | { type: "STREAM_CLIENT_ERROR"; message: string };
