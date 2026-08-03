import { defineState } from "eve/context";
import { MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN } from "./config";

export type SubmitAthletePlanCodeAttemptState = {
  turnId: string | null;
  count: number;
};

export const submitAthletePlanCodeAttempts =
  defineState<SubmitAthletePlanCodeAttemptState>(
    "forge.submit-athlete-plan-code-attempts",
    () => ({
      turnId: null,
      count: 0,
    }),
  );

export function nextSubmitAthletePlanCodeAttempt(
  state: SubmitAthletePlanCodeAttemptState,
  turnId: string,
): {
  state: SubmitAthletePlanCodeAttemptState;
  allowed: boolean;
  attempt: number;
} {
  const base =
    state.turnId === turnId ? state : { turnId, count: 0 };
  const attempt = base.count + 1;

  return {
    state: { turnId, count: attempt },
    allowed: attempt <= MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN,
    attempt,
  };
}

export function reserveSubmitAthletePlanCodeAttempt(turnId: string): {
  allowed: boolean;
  attempt: number;
} {
  let result: { allowed: boolean; attempt: number } = {
    allowed: false,
    attempt: 0,
  };

  submitAthletePlanCodeAttempts.update((current) => {
    const next = nextSubmitAthletePlanCodeAttempt(current, turnId);
    result = { allowed: next.allowed, attempt: next.attempt };
    return next.state;
  });

  return result;
}
