import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

const LOGIN_MESSAGES: Record<string, string> = {
  "check-email": "Check your email to confirm your account, then sign in.",
  "reset-email-sent": "If that email exists, a reset link is on its way.",
};

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ message?: string; error?: string }>;
}>) {
  const params = await searchParams;
  const banner =
    (params.message && LOGIN_MESSAGES[params.message]) ||
    params.error ||
    null;

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back to Forge."
      footer={
        <Link href="/auth/signup" className="font-medium text-zinc-900 dark:text-zinc-100">
          Create an account
        </Link>
      }
    >
      <LoginForm banner={banner} />
    </AuthShell>
  );
}
