"use client";

import { useCallback, useState } from "react";
import { AuthRoleTitle } from "@/components/auth/auth-role-title";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardHeader } from "@/components/ui";
import { setSignupRoleCookieAction } from "@/lib/auth/form-actions";
import type { UserRole } from "@/lib/auth/types";

type AuthMode = "sign-in" | "sign-up";

export function AuthPanel({
  initialRole,
  initialBanner,
}: {
  initialRole: UserRole;
  initialBanner?: string | null;
}) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [role, setRole] = useState<UserRole>(initialRole);

  const handleRoleChange = useCallback((nextRole: UserRole) => {
    setRole(nextRole);
    void setSignupRoleCookieAction(nextRole);
  }, []);

  return (
    <section className="flex w-full items-center justify-center p-4 sm:p-8 md:w-1/3">
      <Card role={mode === "sign-up" ? role : undefined}>
        <CardHeader>
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === "sign-in" ? (
              "Sign in"
            ) : (
              <AuthRoleTitle role={role} onRoleChange={handleRoleChange} />
            )}
          </h2>
        </CardHeader>

        {mode === "sign-in" ? (
          <LoginForm
            banner={initialBanner}
            onSwitchToSignup={() => setMode("sign-up")}
          />
        ) : (
          <SignupForm
            role={role}
            onSwitchToSignIn={() => setMode("sign-in")}
          />
        )}
      </Card>
    </section>
  );
}
