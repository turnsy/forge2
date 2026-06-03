import { afterEach, describe, expect, it } from "vitest";
import {
  getAiGatewayApiKey,
  getVercelOidcToken,
  isAiGatewayConfigured,
  isSandboxAuthConfigured,
  isSandboxIntegrationEnabled,
} from "@/lib/env/plan-generation";

const ENV_KEYS = [
  "AI_GATEWAY_API_KEY",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_TOKEN",
  "VERCEL_ACCESS_TOKEN",
  "RUN_SANDBOX_INTEGRATION",
] as const;

function clearPlanGenEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("plan-generation env helpers", () => {
  afterEach(() => {
    clearPlanGenEnv();
  });

  it("reads trimmed AI Gateway key", () => {
    process.env.AI_GATEWAY_API_KEY = "  test-key  ";
    expect(getAiGatewayApiKey()).toBe("test-key");
    expect(isAiGatewayConfigured()).toBe(true);
  });

  it("reports sandbox auth when OIDC or access token is set", () => {
    expect(isSandboxAuthConfigured()).toBe(false);
    process.env.VERCEL_OIDC_TOKEN = "oidc";
    expect(getVercelOidcToken()).toBe("oidc");
    expect(isSandboxAuthConfigured()).toBe(true);
  });

  it("enables integration tests only when flag is set", () => {
    expect(isSandboxIntegrationEnabled()).toBe(false);
    process.env.RUN_SANDBOX_INTEGRATION = "1";
    expect(isSandboxIntegrationEnabled()).toBe(true);
  });
});
