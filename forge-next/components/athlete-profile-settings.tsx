"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardFooter, CardHeader, Input, Message } from "@/components/ui";
import {
  updateProfileEmailAction,
  updateProfileFullNameAction,
} from "@/lib/profile/actions";

export function AthleteProfileSettings({
  fullName,
  email,
}: {
  fullName: string | null;
  email: string | undefined;
}) {
  const [name, setName] = useState(fullName ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [namePending, startNameTransition] = useTransition();

  const [nextEmail, setNextEmail] = useState(email ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailPending, startEmailTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <Card role="athlete">
        <CardHeader className="space-y-1 text-left">
          <h2 className="text-base font-semibold text-surface-foreground">Profile</h2>
          <p className="text-sm text-surface-muted">
            Update how your name appears in the app.
          </p>
        </CardHeader>
        <Input
          label="Full name"
          name="fullName"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameSuccess(false);
          }}
          autoComplete="name"
        />
        {nameError ? <Message tone="error">{nameError}</Message> : null}
        {nameSuccess ? <Message tone="success">Name saved.</Message> : null}
        <CardFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={namePending}
            onClick={() => {
              setNameError(null);
              setNameSuccess(false);
              startNameTransition(async () => {
                const result = await updateProfileFullNameAction(name);
                if (!result.ok) {
                  setNameError(result.message ?? "Something went wrong.");
                  return;
                }
                setNameSuccess(true);
              });
            }}
          >
            {namePending ? "Saving…" : "Save name"}
          </Button>
        </CardFooter>
      </Card>

      <Card role="athlete">
        <CardHeader className="space-y-1 text-left">
          <h2 className="text-base font-semibold text-surface-foreground">Email</h2>
          <p className="text-sm text-surface-muted">
            Changing your email sends a confirmation link to the new address.
          </p>
        </CardHeader>
        <Input
          label="Email"
          name="email"
          type="email"
          value={nextEmail}
          onChange={(event) => {
            setNextEmail(event.target.value);
            setEmailSuccess(false);
          }}
          autoComplete="email"
        />
        {emailError ? <Message tone="error">{emailError}</Message> : null}
        {emailSuccess ? (
          <Message tone="success">Check your email to confirm the change.</Message>
        ) : null}
        <CardFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={emailPending}
            onClick={() => {
              setEmailError(null);
              setEmailSuccess(false);
              startEmailTransition(async () => {
                const result = await updateProfileEmailAction(nextEmail);
                if (!result.ok) {
                  setEmailError(result.message ?? "Something went wrong.");
                  return;
                }
                setEmailSuccess(true);
              });
            }}
          >
            {emailPending ? "Sending…" : "Update email"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
