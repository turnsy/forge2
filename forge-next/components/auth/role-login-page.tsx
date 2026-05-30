import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { loginHubPath } from "@/lib/auth/routes";
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
  const label = role === "coach" ? "Coach" : "Athlete";
  const banner =
    (query.message && LOGIN_MESSAGES[query.message]) || query.error || null;

  return (
    <AuthShell
      title={`Sign in as ${label}`}
      description="Sign in with email or Google."
      footer={
        <Link
          href={loginHubPath()}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Choose a different role
        </Link>
      }
    >
      <LoginForm role={role} banner={banner} />
    </AuthShell>
  );
}
