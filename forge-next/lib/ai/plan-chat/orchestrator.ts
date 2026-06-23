import {
  type ModelMessage,
  stepCountIs,
  streamText,
} from "ai";
import { listSessionUploads } from "@/lib/uploads/list-session-uploads";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import { createPlanChatGatewayModel } from "@/lib/ai/plan-chat/gateway";
import {
  PLAN_CHAT_MAX_TOOL_STEPS,
} from "@/lib/ai/plan-chat/constants";
import { createCoachAgentTools } from "@/lib/ai/coach-agent/tools/create-coach-agent-tools";
import { buildCoachAgentSystemPrompt } from "@/lib/ai/plan-chat/prompts/system-prompts";
import type { SubmitPlanCodeError } from "@/lib/ai/plan-chat/tools/execute-submit-plan-code";
import type { PlanChatEmit, PlanChatMessage } from "@/lib/ai/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { runSandbox } from "@/lib/sandbox";


export type RunPlanChatInput = {
  coachId: string;
  sessionId: string;
  prompt: string;
  messages: PlanChatMessage[];
  currentArtifact: WorkoutPlan | null;
  emit: PlanChatEmit;
};

export type PlanChatOrchestratorDeps = {
  streamTextFn?: typeof streamText;
  runSandbox?: typeof runSandbox;
  listSessionUploads?: typeof listSessionUploads;
  isGatewayConfigured?: () => boolean;
  createModel?: () => ReturnType<typeof createPlanChatGatewayModel>;
};

function toModelMessages(
  history: PlanChatMessage[],
  prompt: string,
): ModelMessage[] {
  const prior: ModelMessage[] = history.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  return [...prior, { role: "user", content: prompt }];
}

export async function runPlanChat(
  input: RunPlanChatInput,
  deps: PlanChatOrchestratorDeps = {},
): Promise<void> {
  const streamTextFn = deps.streamTextFn ?? streamText;
  const executeSandbox = deps.runSandbox ?? runSandbox;
  const listUploads = deps.listSessionUploads ?? listSessionUploads;
  const gatewayConfigured = deps.isGatewayConfigured ?? isAiGatewayConfigured;
  const createModel = deps.createModel ?? createPlanChatGatewayModel;

  if (!gatewayConfigured()) {
    input.emit({
      type: "errors",
      errors: [
        {
          code: "GATEWAY_NOT_CONFIGURED",
          message: "AI Gateway is not configured (AI_GATEWAY_API_KEY).",
        },
      ],
    });
    input.emit({ type: "runStatus", status: "error" });
    return;
  }

  input.emit({ type: "runStatus", status: "parsing" });

  const sessionFiles = await listUploads(input.coachId, input.sessionId);

  const hasSessionUploads = sessionFiles.length > 0;
  const system = buildCoachAgentSystemPrompt({
    hasSessionUploads,
  });

  let producedArtifact: WorkoutPlan | null = null;
  let lastSubmitErrors: SubmitPlanCodeError[] | null = null;
  let clearedArtifact = false;
  const tools = createCoachAgentTools({
    coachId: input.coachId,
    sessionId: input.sessionId,
    currentArtifact: input.currentArtifact,
    runSandbox: executeSandbox,
    onRunStatus: (status) => {
      input.emit({ type: "runStatus", status });
    },
    onPlanArtifactReady: (plan) => {
      producedArtifact = plan;
      lastSubmitErrors = null;
    },
    onSubmitPlanCodeFailed: (errors) => {
      lastSubmitErrors = errors;
    },
    onSetCurrentArtifact: ({ planId, plan, title }) => {
      input.emit({
        type: "setArtifact",
        planId,
        plan,
        title,
      });
    },
    onClearCurrentArtifact: () => {
      clearedArtifact = true;
    },
  });

  input.emit({ type: "runStatus", status: "generating" });

  let model;
  try {
    model = createModel();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model setup failed.";
    input.emit({ type: "errors", errors: [{ code: "GATEWAY_ERROR", message }] });
    input.emit({ type: "runStatus", status: "error" });
    return;
  }

  const result = streamTextFn({
    model,
    system,
    messages: toModelMessages(input.messages, input.prompt),
    tools,
    stopWhen: stepCountIs(PLAN_CHAT_MAX_TOOL_STEPS),
  });

  for await (const delta of result.textStream) {
    if (delta.length > 0) {
      input.emit({ type: "assistantTextDelta", delta });
    }
  }

  await result;

  if (clearedArtifact) {
    input.emit({ type: "clearArtifact" });
  }

  if (producedArtifact) {
    input.emit({ type: "artifact", plan: producedArtifact });
    input.emit({ type: "runStatus", status: "done" });
    return;
  }

  if (lastSubmitErrors) {
    input.emit({ type: "errors", errors: lastSubmitErrors });
    input.emit({ type: "runStatus", status: "error" });
    return;
  }

  input.emit({ type: "runStatus", status: "done" });
}
