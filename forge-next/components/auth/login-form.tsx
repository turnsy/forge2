"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Divider, Input, Message, SubmitButton } from "@/components/ui";
import { loginFormAction, oauthFormAction } from "@/lib/auth/form-actions";
import { signupPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";

export function LoginForm({
  role,
  banner,
}: {
  role: UserRole;
  banner?: string | null;
}) {
  const [state, formAction] = useActionState(loginFormAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canContinue = email.trim().length > 0 && password.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {banner ? <Message tone="info">{banner}</Message> : null}
      {state && !state.ok ? (
        <Message tone="error">{state.error}</Message>
      ) : null}

      <form action={oauthFormAction}>
        <input type="hidden" name="provider" value="google" />
        <input type="hidden" name="role" value={role} />
        <SubmitButton
          variant="ghost"
          icon={<GoogleIcon />}
          pendingLabel="Redirecting…"
        >
          Continue with Google
        </SubmitButton>
      </form>

      <Divider />

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <Input
          aria-label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          aria-label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <SubmitButton disabled={!canContinue} pendingLabel="Signing in…">
          Continue
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        New to Forge?{" "}
        <Link
          href={signupPathForRole(role)}
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Create Account →
        </Link>
      </p>
    </div>
  );
}
