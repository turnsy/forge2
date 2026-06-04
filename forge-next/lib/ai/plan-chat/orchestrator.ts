import {
  type ModelMessage,
  stepCountIs,
  streamText,
} from "ai";
import { listDraftUploads } from "@/lib/uploads/list-draft-uploads";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import { createPlanChatGatewayModel } from "@/lib/ai/plan-chat/gateway";
import {
  PLAN_CHAT_MAX_TOOL_STEPS,
} from "@/lib/ai/plan-chat/constants";
import { createPlanChatTools } from "@/lib/ai/plan-chat/tools/create-plan-chat-tools";
import {
  assertSystemPromptExcludesFullArtifact,
  buildPlanChatSystemPrompt,
} from "@/lib/ai/plan-chat/system-prompts";
import type { PlanChatEmit, PlanChatMessage } from "@/lib/ai/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { runPlanSandbox } from "@/lib/sandbox";

export type RunPlanChatInput = {
  coachId: string;
  draftId?: string;
  prompt: string;
  messages: PlanChatMessage[];
  currentArtifact: WorkoutPlan | null;
  contextFileIds?: string[];
  emit: PlanChatEmit;
};

export type PlanChatOrchestratorDeps = {
  streamTextFn?: typeof streamText;
  runSandbox?: typeof runPlanSandbox;
  listDrafts?: typeof listDraftUploads;
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
  const runSandbox = deps.runSandbox ?? runPlanSandbox;
  const listDrafts = deps.listDrafts ?? listDraftUploads;
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

  
  const draftFiles = input.draftId
    ? await listDrafts(input.coachId, input.draftId)
    : [];

  const hasDraftUploads = draftFiles.length > 0;
  const system = buildPlanChatSystemPrompt({
    currentArtifact: input.currentArtifact,
    hasDraftUploads,
  });

  if (input.currentArtifact) {
    assertSystemPromptExcludesFullArtifact(system, input.currentArtifact);
  }

  let submittedPython: string | null = null;
  const tools = createPlanChatTools({
    coachId: input.coachId,
    draftId: input.draftId,
    contextFileIds: input.contextFileIds,
    onSubmitPlanCode: (python) => {
      submittedPython = python;
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

  if (!submittedPython) {
    input.emit({ type: "runStatus", status: "done" });
    return;
  }

  input.emit({ type: "runStatus", status: "sandbox" });

  const sandboxResult = await runSandbox({
    currentPlan: input.currentArtifact,
    generatedPython: submittedPython,
  });

  if (!sandboxResult.ok) {
    input.emit({
      type: "errors",
      errors: [
        { code: sandboxResult.code, message: sandboxResult.message },
      ],
    });
    input.emit({ type: "runStatus", status: "error" });
    return;
  }

  input.emit({ type: "runStatus", status: "validating" });

  const validated = loadWorkoutPlan(sandboxResult.plan);
  if (!validated.ok) {
    input.emit({ type: "errors", errors: validated.errors });
    input.emit({ type: "runStatus", status: "error" });
    return;
  }

  input.emit({ type: "artifact", plan: validated.plan });
  input.emit({ type: "runStatus", status: "done" });
}
