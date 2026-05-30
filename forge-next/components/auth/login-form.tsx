"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginFormAction } from "@/lib/auth/form-actions";
import { loginHubPath, signupPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";
import { AuthField } from "@/components/auth/auth-field";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

export function LoginForm({
  role,
  banner,
}: {
  role: UserRole;
  banner?: string | null;
}) {
  const [state, formAction] = useActionState(loginFormAction, null);
  const label = role === "coach" ? "coach" : "athlete";

  return (
    <div className="flex flex-col gap-4">
      {banner ? <AuthMessage tone="info">{banner}</AuthMessage> : null}
      {state && !state.ok ? (
        <AuthMessage tone="error">{state.error}</AuthMessage>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <AuthSubmitButton pendingLabel="Signing in…">
          Sign in as {label}
        </AuthSubmitButton>
      </form>

      <div className="relative text-center text-xs uppercase tracking-wide text-zinc-500">
        <span className="bg-white px-2 dark:bg-black">or</span>
      </div>

      <GoogleOAuthButton label="Continue with Google" role={role} />

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        New {label}?{" "}
        <Link
          href={signupPathForRole(role)}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Create a {label} account
        </Link>
      </p>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href={loginHubPath()}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Sign in as a different role
        </Link>
      </p>
    </div>
  );
}
