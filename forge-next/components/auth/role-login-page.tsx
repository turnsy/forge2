import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { AuthRoleTitle } from "@/components/auth/auth-role-title";
import { resolveLoginBanner } from "@/lib/auth/login-banner";
import type { UserRole } from "@/lib/auth/types";

export async function RoleLoginPage({
  role,
  searchParams,
}: Readonly<{
  role: UserRole;
  searchParams: Promise<{ message?: string; error?: string }>;
}>) {
  const query = await searchParams;
  const banner = resolveLoginBanner(query);
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
