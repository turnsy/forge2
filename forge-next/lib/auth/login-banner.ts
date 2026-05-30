const LOGIN_MESSAGES: Record<string, string> = {
  "check-email": "Check your email to confirm your account, then sign in.",
  "reset-email-sent": "If that email exists, a reset link is on its way.",
};

export function resolveLoginBanner(query: {
  message?: string;
  error?: string;
}): string | null {
  return (query.message && LOGIN_MESSAGES[query.message]) || query.error || null;
}
