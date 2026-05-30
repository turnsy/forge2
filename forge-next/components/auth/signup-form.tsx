"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Divider, Input, Message, SubmitButton } from "@/components/ui";
import { oauthFormAction, signupFormAction } from "@/lib/auth/form-actions";
import { canContinueSignup } from "@/lib/auth/form-validation";
import { loginPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";

export function SignupForm({ role }: { role: UserRole }) {
  const [state, formAction] = useActionState(signupFormAction, null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canContinue = canContinueSignup(fullName, email, password);

  return (
    <div className="flex flex-col gap-4">
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
          aria-label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Full name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="Password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <SubmitButton disabled={!canContinue} pendingLabel="Creating account…">
          Continue
        </SubmitButton>
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
