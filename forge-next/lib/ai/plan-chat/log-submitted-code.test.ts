import { afterEach, describe, expect, it, vi } from "vitest";
import { logSubmittedPlanCode } from "@/lib/ai/plan-chat/log-submitted-code";

describe("logSubmittedPlanCode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    logSubmittedPlanCode("print('hi')", { coachId: "coach-1", sessionId: "s1" });

    expect(info).toHaveBeenCalled();
    expect(info.mock.calls.some((call) => String(call[0]).includes("submit_plan_code"))).toBe(
      true,
    );
    expect(info.mock.calls.some((call) => String(call[1]).includes("print('hi')"))).toBe(
      true,
    );
  });

  it("skips logging in production unless flag is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PLAN_CHAT_LOG_GENERATED_CODE", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    logSubmittedPlanCode("print('hi')", { coachId: "coach-1" });

    expect(info).not.toHaveBeenCalled();
  });
});
