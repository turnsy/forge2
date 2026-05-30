import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  loginHubPath,
  signupPathForRole,
} from "@/lib/auth/routes";

export default function SignupHubPage() {
  return (
    <AuthShell
      title="Create an account"
      description="Choose how you will use Forge."
      footer={
        <Link
          href={loginHubPath()}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Already have an account? Sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-3">
        <Link
          href={signupPathForRole("coach")}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-center font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sign up as a coach
        </Link>
        <Link
          href={signupPathForRole("athlete")}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-center font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sign up as an athlete
        </Link>
      </div>
    </AuthShell>
  );
}
