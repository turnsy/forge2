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
import { oauthFormAction, signupFormAction } from "@/lib/auth/form-actions";
import { loginPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";
import { useServerActionForm } from "@/lib/forms/use-server-action-form";
import { signupSchema } from "@/lib/forms/schemas/auth";

export function SignupForm({ role }: { role: UserRole }) {
  const { form, state, onSubmit } = useServerActionForm({
    schema: signupSchema,
    defaultValues: { fullName: "", email: "", password: "", role },
    action: signupFormAction,
  });

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

      <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4">
        <input type="hidden" {...form.register("role")} />
        <FormField
          name="fullName"
          render={({ field }) => (
            <FormFieldItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                />
              </FormControl>
              <FormMessage />
            </FormFieldItem>
          )}
        />
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
                  autoComplete="new-password"
                  placeholder="Password"
                />
              </FormControl>
              <FormMessage />
            </FormFieldItem>
          )}
        />
        <SubmitButton
          disabled={!form.formState.isValid}
          pendingLabel="Creating account…"
        >
          Continue
        </SubmitButton>
      </Form>

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
