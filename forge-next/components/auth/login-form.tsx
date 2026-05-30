"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginFormAction } from "@/lib/auth/form-actions";
import { AuthField } from "@/components/auth/auth-field";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

export function LoginForm({ banner }: { banner?: string | null }) {
  const [state, formAction] = useActionState(loginFormAction, null);

  return (
    <div className="flex flex-col gap-4">
      {banner ? <AuthMessage tone="info">{banner}</AuthMessage> : null}
      {state && !state.ok ? (
        <AuthMessage tone="error">{state.error}</AuthMessage>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
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
          Sign in
        </AuthSubmitButton>
      </form>

      <div className="relative text-center text-xs uppercase tracking-wide text-zinc-500">
        <span className="bg-white px-2 dark:bg-black">or</span>
      </div>

      <GoogleOAuthButton label="Continue with Google" />

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Need an account?{" "}
        <Link href="/auth/signup" className="font-medium text-zinc-900 dark:text-zinc-100">
          Sign up
        </Link>
      </p>
    </div>
  );
}
