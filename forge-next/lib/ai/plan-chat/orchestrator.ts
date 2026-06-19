import {
  type ModelMessage,
  stepCountIs,
  streamText,
} from "ai";
import { getAssignedPlanById } from "@/lib/athlete/plan/repository";
import { listSessionUploads } from "@/lib/uploads/list-session-uploads";
import { detectLockedSetMutations } from "@/lib/plans/assignment-editability";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import { createPlanChatGatewayModel } from "@/lib/ai/plan-chat/gateway";
import {
  PLAN_CHAT_MAX_TOOL_STEPS,
} from "@/lib/ai/plan-chat/constants";
import { createCoachAgentTools } from "@/lib/ai/coach-agent/tools/create-coach-agent-tools";
import { buildCoachAgentSystemPrompt } from "@/lib/ai/plan-chat/prompts/system-prompts";
import type { PlanChatEmit, PlanChatMessage } from "@/lib/ai/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { runSandbox } from "@/lib/sandbox";
import { logSubmittedPlanCode } from "@/lib/ai/plan-chat/log-submitted-code";


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
  getAssignedPlanById?: typeof getAssignedPlanById;
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
  const fetchAssignedPlan = deps.getAssignedPlanById ?? getAssignedPlanById;

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

  let submittedPython: string | null = null;
  let submittedAssignmentId: string | null = null;
  let artifactForSandbox: WorkoutPlan | null = input.currentArtifact;
  let clearedArtifact = false;
  const tools = createCoachAgentTools({
    coachId: input.coachId,
    sessionId: input.sessionId,
    currentArtifact: input.currentArtifact,
    onSubmitPlanCode: ({ python, assignmentId }) => {
      submittedPython = python;
      submittedAssignmentId = assignmentId ?? null;
      logSubmittedPlanCode(python, {
        coachId: input.coachId,
        sessionId: input.sessionId,
      });
    },
    onSetCurrentArtifact: ({ planId, assignmentId, plan, title }) => {
      artifactForSandbox = plan;
      input.emit({
        type: "setArtifact",
        planId,
        assignmentId,
        plan,
        title,
      });
    },
    onClearCurrentArtifact: () => {
      clearedArtifact = true;
      artifactForSandbox = null;
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

  if (!submittedPython) {
    input.emit({ type: "runStatus", status: "done" });
    return;
  }

  let sandboxSeed = artifactForSandbox;

  if (submittedAssignmentId) {
    const assignmentResult = await fetchAssignedPlan(submittedAssignmentId);

    if (!assignmentResult.ok) {
      input.emit({
        type: "errors",
        errors: [
          {
            code: "ASSIGNMENT_LOOKUP_FAILED",
            message: assignmentResult.message,
          },
        ],
      });
      input.emit({ type: "runStatus", status: "error" });
      return;
    }

    if (!assignmentResult.plan || assignmentResult.plan.coachId !== input.coachId) {
      input.emit({
        type: "errors",
        errors: [
          {
            code: "ASSIGNMENT_NOT_FOUND",
            message: "Active assignment not found for this coach.",
          },
        ],
      });
      input.emit({ type: "runStatus", status: "error" });
      return;
    }

    sandboxSeed = assignmentResult.plan.plan;
  }

  input.emit({ type: "runStatus", status: "sandbox" });

  const sandboxResult = await executeSandbox({
    artifact: {
      type: "plan",
      currentPlan: sandboxSeed,
      generatedPython: submittedPython,
    },
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

  if (submittedAssignmentId && sandboxSeed) {
    const lockedSetErrors = detectLockedSetMutations(
      sandboxSeed,
      validated.plan,
    );

    if (lockedSetErrors.length > 0) {
      input.emit({
        type: "errors",
        errors: lockedSetErrors,
      });
      input.emit({ type: "runStatus", status: "error" });
      return;
    }
  }

  input.emit({ type: "artifact", plan: validated.plan });
  input.emit({ type: "runStatus", status: "done" });
}
