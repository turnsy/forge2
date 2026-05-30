"use client";

import Link from "next/link";
import { GoogleIcon } from "@/components/icons/google-icon";
import {
  Divider,
  Form,
  FormControl,
  FormField,
  FormFieldItem,
  FormLabel,
  FormMessage,
  Input,
  Message,
  SubmitButton,
} from "@/components/ui";
import { loginFormAction, oauthFormAction } from "@/lib/auth/form-actions";
import { signupPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";
import { useServerActionForm } from "@/lib/forms/use-server-action-form";
import { loginSchema } from "@/lib/forms/schemas/auth";

export function LoginForm({
  role,
  banner,
}: {
  role: UserRole;
  banner?: string | null;
}) {
  const { form, state, onSubmit } = useServerActionForm({
    schema: loginSchema,
    defaultValues: { email: "", password: "", role },
    action: loginFormAction,
  });

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

      <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4">
        <input type="hidden" {...form.register("role")} />
        <FormField
          name="email"
          render={({ field }) => (
            <FormFieldItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                />
              </FormControl>
              <FormMessage />
            </FormFieldItem>
          )}
        />
        <FormField
          name="password"
          render={({ field }) => (
            <FormFieldItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                />
              </FormControl>
              <FormMessage />
            </FormFieldItem>
          )}
        />
        <SubmitButton
          disabled={!form.formState.isValid}
          pendingLabel="Signing in…"
        >
          Continue
        </SubmitButton>
      </Form>

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
