"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupFormAction } from "@/lib/auth/form-actions";
import { loginPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";
import { AuthField } from "@/components/auth/auth-field";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

export function SignupForm({ role }: { role: UserRole }) {
  const [state, formAction] = useActionState(signupFormAction, null);
  const label = role === "coach" ? "coach" : "athlete";

  return (
    <div className="flex flex-col gap-4">
      {state && !state.ok ? (
        <AuthMessage tone="error">{state.error}</AuthMessage>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <AuthField
          label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          required
        />
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
          autoComplete="new-password"
          minLength={8}
          required
        />
        <AuthSubmitButton pendingLabel="Creating account…">
          Create {label} account
        </AuthSubmitButton>
      </form>

      <div className="relative text-center text-xs uppercase tracking-wide text-zinc-500">
        <span className="bg-white px-2 dark:bg-black">or</span>
      </div>

      <GoogleOAuthButton label="Continue with Google" role={role} />

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href={loginPathForRole(role)}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
