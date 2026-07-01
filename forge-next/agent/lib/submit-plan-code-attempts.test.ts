import { describe, expect, it } from "vitest";
import { MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN } from "@/agent/lib/config";
import { nextSubmitPlanCodeAttempt } from "@/agent/lib/submit-plan-code-attempts";

describe("nextSubmitPlanCodeAttempt", () => {
  it("allows up to MAX attempts within one turn", () => {
    let state = { turnId: null, count: 0 };

    for (let i = 1; i <= MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN; i += 1) {
      const next = nextSubmitPlanCodeAttempt(state, "turn-1");
      expect(next.allowed).toBe(true);
      expect(next.attempt).toBe(i);
      state = next.state;
    }
  });

  it("blocks attempts beyond the per-turn cap", () => {
    let state = { turnId: null, count: 0 };

    for (let i = 0; i < MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN; i += 1) {
      state = nextSubmitPlanCodeAttempt(state, "turn-1").state;
    }

    const blocked = nextSubmitPlanCodeAttempt(state, "turn-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.attempt).toBe(MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN + 1);
  });

  it("resets the counter when a new turn starts", () => {
    const state = { turnId: "turn-1", count: 4 };
    const nextTurn = nextSubmitPlanCodeAttempt(state, "turn-2");

    expect(nextTurn.allowed).toBe(true);
    expect(nextTurn.attempt).toBe(1);
    expect(nextTurn.state).toEqual({ turnId: "turn-2", count: 1 });
  });
});
