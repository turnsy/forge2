"use client";

import { useCallback, useState } from "react";
import { AuthRoleTitle } from "@/components/auth/auth-role-title";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { CardHeader } from "@/components/ui";
import { setSignupRoleCookieAction } from "@/lib/auth/form-actions";
import type { UserRole } from "@/lib/auth/types";
import { authPanelCardClass } from "@/lib/theme";

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
    <div className={authPanelCardClass(mode === "sign-up" ? role : undefined)}>
      <CardHeader className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
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
    </div>
  );
}
