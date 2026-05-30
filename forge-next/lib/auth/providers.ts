import type { AuthProvider } from "@/lib/auth/types";

const MVP_PROVIDERS: Record<AuthProvider, boolean> = {
  google: true,
  apple: false, // not enabled yet
};

export function isOAuthProviderEnabled(provider: AuthProvider): boolean {
  return MVP_PROVIDERS[provider];
}
