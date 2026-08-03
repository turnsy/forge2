import { describe, expect, it } from "vitest";
import { MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN } from "@/agent/lib/config";
import { nextSubmitAthletePlanCodeAttempt } from "@/agent/lib/submit-athlete-plan-code-attempts";

describe("nextSubmitAthletePlanCodeAttempt", () => {
  it("allows up to MAX attempts within one turn", () => {
    let state = { turnId: null, count: 0 };

    for (let i = 1; i <= MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN; i += 1) {
      const next = nextSubmitAthletePlanCodeAttempt(state, "turn-1");
      expect(next.allowed).toBe(true);
      expect(next.attempt).toBe(i);
      state = next.state;
    }
  });

  it("blocks attempts beyond the per-turn cap", () => {
    let state = { turnId: null, count: 0 };

    for (let i = 0; i < MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN; i += 1) {
      state = nextSubmitAthletePlanCodeAttempt(state, "turn-1").state;
    }

    const blocked = nextSubmitAthletePlanCodeAttempt(state, "turn-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.attempt).toBe(MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN + 1);
  });
});
