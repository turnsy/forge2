import { defineState } from "eve/context";

export const MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN = 5;

export type SubmitPlanCodeAttemptState = {
  turnId: string | null;
  count: number;
};

export const submitPlanCodeAttempts = defineState<SubmitPlanCodeAttemptState>(
  "forge.submit-plan-code-attempts",
  () => ({
    turnId: null,
    count: 0,
  }),
);

export function nextSubmitPlanCodeAttempt(
  state: SubmitPlanCodeAttemptState,
  turnId: string,
): {
  state: SubmitPlanCodeAttemptState;
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

export function reserveSubmitPlanCodeAttempt(turnId: string): {
  allowed: boolean;
  attempt: number;
} {
  let result: { allowed: boolean; attempt: number } = {
    allowed: false,
    attempt: 0,
  };

  submitPlanCodeAttempts.update((current) => {
    const next = nextSubmitPlanCodeAttempt(current, turnId);
    result = { allowed: next.allowed, attempt: next.attempt };
    return next.state;
  });

  return result;
}
