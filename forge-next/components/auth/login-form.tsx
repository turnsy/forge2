"use client";

import { useActionState, useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Divider, Input, Message, SubmitButton } from "@/components/ui";
import { loginFormAction, oauthFormAction } from "@/lib/auth/form-actions";
import { canContinueLogin } from "@/lib/auth/form-validation";

export function LoginForm({
  banner,
  onSwitchToSignup,
}: {
  banner?: string | null;
  onSwitchToSignup: () => void;
}) {
  const [state, formAction] = useActionState(loginFormAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canContinue = canContinueLogin(email, password);

  return (
    <div className="flex flex-col gap-4">
      {banner ? <Message tone="info">{banner}</Message> : null}
      {state && !state.ok ? (
        <Message tone="error">{state.error}</Message>
      ) : null}

      <form action={oauthFormAction}>
        <input type="hidden" name="provider" value="google" />
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

      <p className="text-center text-sm text-surface-muted">
        New to Forge?{" "}
        <button
          type="button"
          className="font-medium text-surface-foreground"
          onClick={onSwitchToSignup}
        >
          Create Account →
        </button>
      </p>
    </div>
  );
}
