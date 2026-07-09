import type { EveCoachReducerData } from "@/lib/chat/session-types";
import { isActiveRunStatus } from "@/lib/chat/run-status-copy";
import { STREAM_INTERRUPTED_MESSAGE } from "@/lib/chat/stream-completion";

/**
 * Why a turn ended without a server boundary event.
 * - "stopped": the user cancelled; finalize silently.
 * - "interrupted": the turn died (timeout, lost stream); surface the
 *   interrupted message once, live. Reloads restore silently ("restored").
 * - "restored": a persisted marker was applied on load; finalize silently.
 */
export type TurnFinalizeReason = "stopped" | "interrupted" | "restored";

export type TurnUiPhase =
  | "idle"
  | "sending"
  | "streaming"
  | "stopping"
  | "error";

export type AgentStoreStatus = "ready" | "submitted" | "streaming" | "error";

/**
 * Client-side record that the current turn was finalized locally at
 * `eventCount` events. Cleared implicitly when the log advances past it —
 * Eve's server log is the source of truth and later events win.
 */
export type LocalTurnFinalization = {
  reason: TurnFinalizeReason;
  eventCount: number;
};

function isTurnOpen(data: EveCoachReducerData): boolean {
  return (
    data.phase === "streaming" ||
    (data.runStatus !== null && isActiveRunStatus(data.runStatus))
  );
}

/**
 * Materializes an in-flight turn into settled conversation state: partial
 * assistant text becomes a normal message, the run status is closed out, and
 * transient errors are dropped (a locally-finalized turn is not an error).
 */
export function finalizeTurnData(
  data: EveCoachReducerData,
  reason: TurnFinalizeReason,
): EveCoachReducerData {
  const assistantText = data.streamingAssistantText.trim();

  if (!isTurnOpen(data) && !assistantText) {
    if (reason === "interrupted") {
      return data;
    }

    // A locally-finalized turn is settled: clear failure debris (e.g. an
    // aborted-send error recorded after the user stopped).
    return {
      ...data,
      errors: [],
      phase: data.phase === "error" ? "idle" : data.phase,
      runStatus: data.runStatus === "error" ? null : data.runStatus,
    };
  }

  const base: EveCoachReducerData = {
    ...data,
    messages: assistantText
      ? [...data.messages, { role: "assistant" as const, content: assistantText }]
      : data.messages,
    streamingAssistantText: "",
    runStatus: assistantText ? "done" : null,
    phase: "idle",
    errors: [],
  };

  if (reason !== "interrupted") {
    return base;
  }

  return {
    ...base,
    errors: [{ message: STREAM_INTERRUPTED_MESSAGE }],
  };
}

export type TurnViewInput = {
  agentStatus: AgentStoreStatus;
  agentErrorMessage: string | null;
  stopPending: boolean;
  finalization: LocalTurnFinalization | null;
  eventCount: number;
  data: EveCoachReducerData;
};

export type TurnView = {
  data: EveCoachReducerData;
  uiPhase: TurnUiPhase;
};

/**
 * Single derivation from (Eve store status, local finalization, projection)
 * to the workspace turn view. This is the whole state machine:
 *
 *   idle -> sending -> streaming -> idle
 *                  \-> stopping -> idle        (user stop; errors swallowed)
 *                  \-> error    -> sending     (next send clears)
 *
 * A local finalization only applies while the event log still ends where it
 * was recorded; once Eve delivers more events, the server's view wins.
 */
export function resolveTurnView(input: TurnViewInput): TurnView {
  const finalizationApplies =
    input.finalization !== null &&
    input.eventCount <= input.finalization.eventCount;

  const agentBusy =
    input.agentStatus === "submitted" || input.agentStatus === "streaming";

  if (input.stopPending && agentBusy) {
    return {
      data: finalizeTurnData(input.data, "stopped"),
      uiPhase: "stopping",
    };
  }

  if (finalizationApplies && !agentBusy && input.finalization) {
    return {
      data: finalizeTurnData(input.data, input.finalization.reason),
      uiPhase: "idle",
    };
  }

  if (agentBusy) {
    return {
      data: input.data,
      uiPhase:
        input.agentStatus === "submitted" &&
        input.data.streamingAssistantText.trim().length === 0
          ? "sending"
          : "streaming",
    };
  }

  const hasError =
    input.agentErrorMessage !== null || input.data.phase === "error";

  if (hasError) {
    const errors = input.agentErrorMessage
      ? [
          { message: input.agentErrorMessage },
          ...input.data.errors.filter(
            (error) => error.message !== input.agentErrorMessage,
          ),
        ]
      : input.data.errors;

    return {
      data: { ...input.data, errors },
      uiPhase: "error",
    };
  }

  if (isTurnOpen(input.data)) {
    // Stream ended but the server is still running the turn (background
    // tools). Send stays blocked; stop finalizes locally.
    return { data: input.data, uiPhase: "streaming" };
  }

  return { data: input.data, uiPhase: "idle" };
}

export function canSendInPhase(uiPhase: TurnUiPhase): boolean {
  return uiPhase === "idle" || uiPhase === "error";
}

export function canStopInPhase(uiPhase: TurnUiPhase): boolean {
  return uiPhase === "sending" || uiPhase === "streaming";
}
