import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { signupHubPath } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";

export function RoleSignupPage({ role }: { role: UserRole }) {
  const label = role === "coach" ? "Coach" : "Athlete";

  return (
    <AuthShell
      title={`Sign up as ${label}`}
      description="Your role is set by this signup route."
      footer={
        <Link
          href={signupHubPath()}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Choose a different role
        </Link>
      }
    >
      <SignupForm role={role} />
    </AuthShell>
  );
}
