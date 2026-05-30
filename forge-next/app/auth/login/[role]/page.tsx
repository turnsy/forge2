import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { loginHubPath } from "@/lib/auth/login";
import { isUserRole } from "@/lib/auth/redirects";

const LOGIN_MESSAGES: Record<string, string> = {
  "check-email": "Check your email to confirm your account, then sign in.",
  "reset-email-sent": "If that email exists, a reset link is on its way.",
};

export default async function LoginRolePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ role: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}>) {
  const { role: roleParam } = await params;
  const query = await searchParams;

  if (!isUserRole(roleParam)) {
    notFound();
  }

  const label = roleParam === "coach" ? "Coach" : "Athlete";
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
      <LoginForm role={roleParam} banner={banner} />
    </AuthShell>
  );
}
