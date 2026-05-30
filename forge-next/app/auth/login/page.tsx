import Link from "next/link";
import { loginHubPath, loginPathForRole } from "@/lib/auth/login";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginHubPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Choose your role to continue."
      footer={
        <Link
          href="/auth/signup"
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Create an account
        </Link>
      }
    >
      <div className="flex flex-col gap-3">
        <Link
          href={loginPathForRole("coach")}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-center font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sign in as a coach
        </Link>
        <Link
          href={loginPathForRole("athlete")}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-center font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sign in as an athlete
        </Link>
      </div>
    </AuthShell>
  );
}
