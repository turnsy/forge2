import type { EveAgentReducer } from "eve/react";
import type { HandleMessageStreamEvent } from "eve/client";
import type {
  EveCoachReducerData,
} from "@/lib/chat/session-types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import type { ChatMessage } from "@/lib/chat/types";

function isToolResult(
  result: unknown,
): result is { kind: "tool-result"; toolName: string; output: unknown } {
  return (
    typeof result === "object" &&
    result !== null &&
    "kind" in result &&
    result.kind === "tool-result" &&
    "toolName" in result &&
    typeof result.toolName === "string"
  );
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
    toolName === "submit_plan_code" ||
    toolName === "set_current_artifact"
  ) {
    if (
      typeof output === "object" &&
      output !== null &&
      "ok" in output &&
      output.ok === true &&
      "plan" in output &&
      output.plan
    ) {
      const plan = output.plan as WorkoutPlan;
      const planId =
        "planId" in output && typeof output.planId === "string"
          ? output.planId
          : data.planId;
      const title =
        "title" in output && typeof output.title === "string"
          ? output.title
          : "name" in output && typeof output.name === "string"
            ? output.name
            : plan.name;

      return {
        ...data,
        currentArtifact: plan,
        planId: planId ?? data.planId,
        artifactTitle: title,
      };
    }
  }

  return data;
}

function eveMessagesToChatMessages(
  messages: readonly { role: string; parts: readonly { type: string; text?: string }[] }[],
): ChatMessage[] {
  const result: ChatMessage[] = [];

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") {
      continue;
    }

    const text = message.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");

    if (message.role === "user" || text.trim().length > 0) {
      result.push({
        role: message.role as "user" | "assistant",
        content: text,
      });
    }
  }

  return result;
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
    reduce: (data, event) => {
      if (event.type === "client.message.submitted") {
        const text =
          "message" in event.data && typeof event.data.message === "string"
            ? event.data.message.trim()
            : "";
        const messages =
          text.length > 0
            ? [...data.messages, { role: "user" as const, content: text }]
            : data.messages;

        return {
          ...data,
          messages,
          phase: "streaming",
          runStatus: null,
          errors: [],
          streamingAssistantText: "",
        };
      }

      if (event.type === "client.message.failed") {
        const message =
          "error" in event.data &&
          typeof event.data.error === "object" &&
          event.data.error !== null &&
          "message" in event.data.error &&
          typeof event.data.error.message === "string"
            ? event.data.error.message
            : "Message failed to send.";
        return {
          ...data,
          phase: "error",
          runStatus: "error",
          errors: [{ message }],
        };
      }

      if (event.type === "turn.started") {
        return { ...data, runStatus: "generating", phase: "streaming" };
      }

      if (event.type === "actions.requested") {
        const actions =
          "actions" in event.data && Array.isArray(event.data.actions)
            ? event.data.actions
            : [];
        const toolNames = actions
          .filter(
            (action): action is { kind: "tool-call"; toolName: string } =>
              typeof action === "object" &&
              action !== null &&
              "kind" in action &&
              action.kind === "tool-call" &&
              "toolName" in action,
          )
          .map((action) => action.toolName);

        if (toolNames.includes("submit_plan_code")) {
          return { ...data, runStatus: "sandbox", errors: [] };
        }
        return data;
      }

      if (event.type === "action.result") {
        const result =
          "result" in event.data ? event.data.result : undefined;
        if (result && isToolResult(result)) {
          let next = applyArtifactFromTool(data, result.toolName, result.output);

          if (result.toolName === "submit_plan_code") {
            const output = result.output;
            const succeeded =
              typeof output === "object" &&
              output !== null &&
              "ok" in output &&
              output.ok === true;

            next = {
              ...next,
              runStatus: succeeded ? "validating" : "sandbox",
              ...(succeeded ? { errors: [] } : {}),
            };
          }

          const isInternalCodegenRetry =
            result.toolName === "submit_plan_code" &&
            typeof result.output === "object" &&
            result.output !== null &&
            "ok" in result.output &&
            result.output.ok === false;

          if (
            !isInternalCodegenRetry &&
            typeof result.output === "object" &&
            result.output !== null &&
            "ok" in result.output &&
            result.output.ok === false &&
            "errors" in result.output &&
            Array.isArray(result.output.errors)
          ) {
            next = {
              ...next,
              errors: result.output.errors.map((entry: { code?: string; path?: string; message: string }) =>
                "path" in entry && entry.path
                  ? { path: entry.path, message: entry.message }
                  : { code: entry.code, message: entry.message },
              ),
              phase: "error",
              runStatus: "error",
            };
          }

          return next;
        }
      }

      if (event.type === "message.appended") {
        const messageSoFar =
          "messageSoFar" in event.data &&
          typeof event.data.messageSoFar === "string"
            ? event.data.messageSoFar
            : data.streamingAssistantText;

        return {
          ...data,
          streamingAssistantText: messageSoFar,
        };
      }

      if (event.type === "message.completed") {
        const message =
          "message" in event.data && typeof event.data.message === "string"
            ? event.data.message
            : null;

        if (message && message.trim().length > 0) {
          return {
            ...data,
            streamingAssistantText: message,
          };
        }

        return data;
      }

      if (event.type === "turn.completed") {
        const assistantText = data.streamingAssistantText.trim();
        const messages =
          assistantText.length > 0
            ? [
                ...data.messages,
                { role: "assistant" as const, content: assistantText },
              ]
            : data.messages;

        return {
          ...data,
          messages,
          streamingAssistantText: "",
          runStatus: "done",
          phase: "idle",
        };
      }

      if (
        event.type === "turn.failed" ||
        event.type === "step.failed" ||
        event.type === "session.failed"
      ) {
        const message =
          "message" in event.data && typeof event.data.message === "string"
            ? event.data.message
            : "The assistant run failed.";
        return {
          ...data,
          phase: "error",
          runStatus: "error",
          errors: [{ message }],
          streamingAssistantText: "",
        };
      }

      if (event.type === "message.received") {
        const text =
          "message" in event.data && typeof event.data.message === "string"
            ? event.data.message.trim()
            : "";
        if (!text) {
          return data;
        }

        const lastMessage = data.messages.at(-1);
        if (
          lastMessage?.role === "user" &&
          lastMessage.content.trim() === text
        ) {
          return data;
        }

        return {
          ...data,
          messages: [...data.messages, { role: "user", content: text }],
        };
      }

      return data;
    },
  };
}

export { eveMessagesToChatMessages };
