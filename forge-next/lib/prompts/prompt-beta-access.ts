// Temporary email allowlist until feature flags ship. Delete this module when reverting.
const PROMPT_BETA_ALLOWLIST = new Set([
  "jayturnsek@gmail.com",
  "masonmcgriskin19@gmail.com",
]);

export function isPromptBetaEnabled(email: string | undefined): boolean {
  if (!email) {
    return false;
  }

  return PROMPT_BETA_ALLOWLIST.has(email.trim().toLowerCase());
}
