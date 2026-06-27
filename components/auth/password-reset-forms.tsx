"use client";

import Link from "next/link";
import { useActionState } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, updatePassword } from "@/lib/auth/actions";
import {
  type AuthActionState,
  initialAuthActionState,
} from "@/lib/auth/validation";

function fieldError(state: AuthActionState, name: string) {
  return state.errors?.[name]?.[0];
}

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(
    requestPasswordReset,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <Input
          aria-describedby="email-error"
          autoComplete="email"
          defaultValue={state.fields?.email}
          id="email"
          name="email"
          placeholder="you@company.com"
          type="email"
        />
        {fieldError(state, "email") ? (
          <p className="text-sm text-destructive" id="email-error">
            {fieldError(state, "email")}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Sending">Email reset link</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          className="font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="/login"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(
    updatePassword,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="password"
        >
          New password
        </label>
        <PasswordInput
          aria-describedby="password-error"
          autoComplete="new-password"
          id="password"
          name="password"
          placeholder="Minimum 8 characters"
        />
        {fieldError(state, "password") ? (
          <p className="text-sm text-destructive" id="password-error">
            {fieldError(state, "password")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="passwordConfirm"
        >
          Confirm password
        </label>
        <PasswordInput
          aria-describedby="passwordConfirm-error"
          autoComplete="new-password"
          id="passwordConfirm"
          name="passwordConfirm"
          placeholder="Repeat new password"
        />
        {fieldError(state, "passwordConfirm") ? (
          <p className="text-sm text-destructive" id="passwordConfirm-error">
            {fieldError(state, "passwordConfirm")}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Updating">Update password</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          className="font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="/forgot-password"
        >
          Request a new reset link
        </Link>
      </p>
    </form>
  );
}
