import type { EveAgentReducer } from "eve/react";
import type {
  ActionResultStreamEvent,
  ActionsRequestedStreamEvent,
  EveAgentReducerEvent,
} from "eve/client";
import type { EveCoachReducerData } from "@/lib/chat/session-types";
import {
  isPlanArtifactToolSuccess,
  isSubmitPlanCodeOutput,
  isToolErrorsOutput,
  toForgeToolDisplayErrors,
} from "@/lib/chat/adapters/plan/forge-tool-outputs";
import { isUserAbortError } from "@/lib/chat/stream-completion";

type ForgeToolResult = Extract<
  ActionResultStreamEvent["data"]["result"],
  { kind: "tool-result" }
>;

function getRequestedToolNames(event: ActionsRequestedStreamEvent): string[] {
  return event.data.actions
    .filter(
      (action): action is Extract<typeof action, { kind: "tool-call" }> =>
        action.kind === "tool-call",
    )
    .map((action) => action.toolName);
}

function isForgeToolResult(
  result: ActionResultStreamEvent["data"]["result"],
): result is ForgeToolResult {
  return result.kind === "tool-result";
}

function applyArtifactFromTool(
  data: EveCoachReducerData,
  toolName: string,
  output: unknown,
): EveCoachReducerData {
  if (toolName === "clear_current_artifact") {
    return {
      ...data,
      currentArtifact: null,
      planId: null,
      artifactTitle: "",
    };
  }

  if (
    (toolName === "submit_plan_code" || toolName === "set_current_artifact") &&
    isPlanArtifactToolSuccess(output)
  ) {
    const title =
      output.title ?? output.name ?? output.plan.name ?? data.artifactTitle;

    return {
      ...data,
      currentArtifact: output.plan,
      planId: output.planId ?? data.planId,
      artifactTitle: title,
    };
  }

  return data;
}

function applySubmitPlanCodeResult(
  data: EveCoachReducerData,
  output: unknown,
): EveCoachReducerData {
  let next = applyArtifactFromTool(data, "submit_plan_code", output);

  if (isSubmitPlanCodeOutput(output)) {
    next = {
      ...next,
      runStatus: output.ok ? "validating" : "sandbox",
      ...(output.ok ? { errors: [] } : {}),
    };

    if (!output.ok) {
      return next;
    }
  }

  return next;
}

function applyToolFailureErrors(
  data: EveCoachReducerData,
  toolName: string,
  output: unknown,
): EveCoachReducerData {
  if (toolName === "submit_plan_code") {
    return data;
  }

  if (!isToolErrorsOutput(output)) {
    return data;
  }

  return {
    ...data,
    errors: toForgeToolDisplayErrors(output.errors),
    phase: "error",
    runStatus: "error",
  };
}

function appendUserMessage(
  data: EveCoachReducerData,
  text: string,
): EveCoachReducerData {
  const trimmed = text.trim();
  if (!trimmed) {
    return data;
  }

  const lastMessage = data.messages.at(-1);
  if (
    lastMessage?.role === "user" &&
    lastMessage.content.trim() === trimmed
  ) {
    return data;
  }

  return {
    ...data,
    messages: [...data.messages, { role: "user" as const, content: trimmed }],
  };
}

function finalizeAssistantTurn(
  data: EveCoachReducerData,
): EveCoachReducerData {
  const assistantText = data.streamingAssistantText.trim();

  return {
    ...data,
    messages:
      assistantText.length > 0
        ? [
            ...data.messages,
            { role: "assistant" as const, content: assistantText },
          ]
        : data.messages,
    streamingAssistantText: "",
    runStatus: "done",
    phase: "idle",
  };
}

export function createEveCoachReducer(
  initial: Partial<EveCoachReducerData> = {},
): EveAgentReducer<EveCoachReducerData> {
  return {
    initial: () => ({
      messages: initial.messages ?? [],
      currentArtifact: initial.currentArtifact ?? null,
      planId: initial.planId ?? null,
      artifactTitle: initial.artifactTitle ?? "",
      runStatus: null,
      streamingAssistantText: "",
      errors: [],
      phase: "idle",
      warnings: [],
    }),
    reduce: (data, event: EveAgentReducerEvent) => {
      switch (event.type) {
        case "client.message.submitted": {
          const text = event.data.message.trim();
          return {
            ...data,
            messages:
              text.length > 0
                ? [...data.messages, { role: "user" as const, content: text }]
                : data.messages,
            phase: "streaming",
            runStatus: null,
            errors: [],
            streamingAssistantText: "",
          };
        }

        case "client.message.failed": {
          const next = appendUserMessage(data, event.data.message);
          const aborted = isUserAbortError(event.data.error.message);

          if (aborted) {
            return next;
          }

          return {
            ...next,
            phase: "error",
            runStatus: "error",
            errors: [{ message: event.data.error.message }],
          };
        }

        case "turn.started":
          return { ...data, runStatus: "generating", phase: "streaming" };

        case "actions.requested": {
          if (getRequestedToolNames(event).includes("submit_plan_code")) {
            return { ...data, runStatus: "sandbox", errors: [] };
          }
          return data;
        }

        case "action.result": {
          const { result } = event.data;
          if (!isForgeToolResult(result)) {
            return data;
          }

          if (result.toolName === "submit_plan_code") {
            return applySubmitPlanCodeResult(data, result.output);
          }

          let next = applyArtifactFromTool(data, result.toolName, result.output);
          next = applyToolFailureErrors(next, result.toolName, result.output);
          return next;
        }

        case "message.appended":
          return {
            ...data,
            streamingAssistantText: event.data.messageSoFar,
          };

        case "message.completed": {
          const message = event.data.message?.trim();
          if (!message) {
            return data;
          }

          return {
            ...data,
            streamingAssistantText: message,
          };
        }

        case "turn.completed":
        case "session.waiting":
        case "session.completed":
          return finalizeAssistantTurn(data);

        case "turn.failed":
        case "step.failed":
        case "session.failed":
          return {
            ...data,
            phase: "error",
            runStatus: "error",
            errors: [{ message: event.data.message }],
            streamingAssistantText: "",
          };

        case "message.received": {
          const text = event.data.message.trim();
          if (!text) {
            return data;
          }

          return appendUserMessage(data, text);
        }

        default:
          return data;
      }
    },
  };
}
