import { Suspense } from "react";
import { AuthRoleTitle } from "@/components/auth/auth-role-title";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import type { UserRole } from "@/lib/auth/types";

export function RoleSignupPage({ role }: { role: UserRole }) {
  const roleLabel = role === "coach" ? "Coach" : "Athlete";

  return (
    <AuthShell
      role={role}
      title={
        <Suspense fallback={<>Register as {roleLabel}</>}>
          <AuthRoleTitle role={role} mode="sign-up" />
        </Suspense>
      }
    >
      <SignupForm role={role} />
    </AuthShell>
  );
}
