import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { AuthRoleTitle } from "@/components/auth/auth-role-title";
import type { UserRole } from "@/lib/auth/types";

const LOGIN_MESSAGES: Record<string, string> = {
  "check-email": "Check your email to confirm your account, then sign in.",
  "reset-email-sent": "If that email exists, a reset link is on its way.",
};

export async function RoleLoginPage({
  role,
  searchParams,
}: Readonly<{
  role: UserRole;
  searchParams: Promise<{ message?: string; error?: string }>;
}>) {
  const query = await searchParams;
  const banner =
    (query.message && LOGIN_MESSAGES[query.message]) || query.error || null;
  const roleLabel = role === "coach" ? "Coach" : "Athlete";

  return (
    <AuthShell
      role={role}
      title={
        <Suspense fallback={<>Sign in as {roleLabel}</>}>
          <AuthRoleTitle role={role} mode="sign-in" />
        </Suspense>
      }
    >
      <LoginForm role={role} banner={banner} />
    </AuthShell>
  );
}
