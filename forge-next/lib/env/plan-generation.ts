/**
 * Environment helpers for plan generation (AI Gateway + Vercel Sandbox).
 * @see docs/plan-generation/phases/phase-1-foundation.md
 */

export function getAiGatewayApiKey(): string | undefined {
  return trimEnv(process.env.AI_GATEWAY_API_KEY);
}

export function getVercelOidcToken(): string | undefined {
  return trimEnv(process.env.VERCEL_OIDC_TOKEN);
}

export function isAiGatewayConfigured(): boolean {
  return Boolean(getAiGatewayApiKey());
}

/** Sandbox auth: OIDC on Vercel deploys; OIDC token or team token for local dev. */
export function isSandboxAuthConfigured(): boolean {
  return Boolean(
    getVercelOidcToken() ||
      trimEnv(process.env.VERCEL_TOKEN) ||
      trimEnv(process.env.VERCEL_ACCESS_TOKEN),
  );
}

export function isSandboxIntegrationEnabled(): boolean {
  return process.env.RUN_SANDBOX_INTEGRATION === "1";
}

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
