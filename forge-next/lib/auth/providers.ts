import type { AuthProvider } from "@/lib/auth/types";

/** Flip when Apple Sign In is configured and ready for production. */
export const APPLE_SIGN_IN_ENABLED = false;

const MVP_PROVIDERS: Record<AuthProvider, boolean> = {
  google: true,
  apple: APPLE_SIGN_IN_ENABLED,
};

export function isOAuthProviderEnabled(provider: AuthProvider): boolean {
  return MVP_PROVIDERS[provider];
}

export function oauthProviderUnavailableMessage(provider: AuthProvider): string {
  if (provider === "apple") {
    return "Sign in with Apple is not available yet.";
  }

  return `${provider} sign-in is not available.`;
}
