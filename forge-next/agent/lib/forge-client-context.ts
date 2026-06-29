import { loadWorkoutPlan } from "@/lib/plans/validate";
import {
  FORGE_CLIENT_CONTEXT_MARKER,
  type ForgeClientContext,
} from "@/lib/chat/adapters/plan/forge-client-context";
import {
  coachArtifact,
  setCoachArtifact,
} from "./coach-artifact-state";

const CLIENT_CONTEXT_PREFIX = "Client context:\n";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseForgeClientContext(value: unknown): ForgeClientContext | null {
  if (!isRecord(value) || value.forge !== FORGE_CLIENT_CONTEXT_MARKER) {
    return null;
  }

  if (typeof value.forgeSessionId !== "string") {
    return null;
  }

  const clientArtifact = value.clientArtifact;
  if (clientArtifact === undefined || clientArtifact === null) {
    return {
      forge: FORGE_CLIENT_CONTEXT_MARKER,
      forgeSessionId: value.forgeSessionId,
    };
  }

  if (!isRecord(clientArtifact) || !isRecord(clientArtifact.plan)) {
    return null;
  }

  const validated = loadWorkoutPlan(clientArtifact.plan);
  if (!validated.ok) {
    return null;
  }

  return {
    forge: FORGE_CLIENT_CONTEXT_MARKER,
    forgeSessionId: value.forgeSessionId,
    clientArtifact: {
      plan: validated.plan,
      planId:
        typeof clientArtifact.planId === "string"
          ? clientArtifact.planId
          : null,
      title:
        typeof clientArtifact.title === "string"
          ? clientArtifact.title
          : validated.plan.name,
    },
  };
}

export function parseForgeClientContextMessage(
  message: string,
): ForgeClientContext | null {
  if (!message.startsWith(CLIENT_CONTEXT_PREFIX)) {
    return null;
  }

  const payload = message.slice(CLIENT_CONTEXT_PREFIX.length).trim();
  if (payload.length === 0) {
    return null;
  }

  try {
    return parseForgeClientContext(JSON.parse(payload));
  } catch {
    return null;
  }
}

function stablePlanJson(plan: unknown): string {
  return JSON.stringify(plan);
}

function coachArtifactMatches(context: ForgeClientContext): boolean {
  const incoming = context.clientArtifact;
  if (!incoming) {
    return coachArtifact.get().plan === null;
  }

  const current = coachArtifact.get();
  if (!current.plan) {
    return false;
  }

  return (
    current.planId === (incoming.planId ?? null) &&
    (incoming.title ?? incoming.plan.name) === current.title &&
    stablePlanJson(current.plan) === stablePlanJson(incoming.plan)
  );
}

export function syncCoachArtifactFromClientContext(
  context: ForgeClientContext,
): void {
  if (!context.clientArtifact) {
    return;
  }

  if (coachArtifactMatches(context)) {
    return;
  }

  setCoachArtifact({
    plan: context.clientArtifact.plan,
    planId: context.clientArtifact.planId ?? null,
    title:
      context.clientArtifact.title ?? context.clientArtifact.plan.name,
  });
}

export function extractForgeClientContextFromMessages(
  messages: readonly { role: string; content: unknown }[],
): ForgeClientContext | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") {
      continue;
    }

    if (typeof message.content === "string") {
      const parsed = parseForgeClientContextMessage(message.content);
      if (parsed) {
        return parsed;
      }
      continue;
    }

    if (!Array.isArray(message.content)) {
      continue;
    }

    for (const part of message.content) {
      if (
        isRecord(part) &&
        part.type === "text" &&
        typeof part.text === "string"
      ) {
        const parsed = parseForgeClientContextMessage(part.text);
        if (parsed) {
          return parsed;
        }
      }
    }
  }

  return null;
}
