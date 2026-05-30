"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signupFormAction } from "@/lib/auth/form-actions";
import { loginPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthField } from "@/components/auth/auth-field";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

export function SignupForm({ role }: { role: UserRole }) {
  const [state, formAction] = useActionState(signupFormAction, null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canContinue =
    fullName.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  return (
    <div className="flex flex-col gap-4">
      {state && !state.ok ? (
        <AuthMessage tone="error">{state.error}</AuthMessage>
      ) : null}

      <GoogleOAuthButton label="Continue with Google" role={role} />

      <AuthDivider />

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <AuthField
          aria-label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Full name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <AuthField
          aria-label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AuthField
          aria-label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <AuthSubmitButton disabled={!canContinue} pendingLabel="Creating account…">
          Continue
        </AuthSubmitButton>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href={loginPathForRole(role)}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Sign in →
        </Link>
      </p>
    </div>
  );
}
