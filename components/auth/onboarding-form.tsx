"use client";

import type * as React from "react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { createWorkspace } from "@/lib/auth/actions";
import {
  type AuthActionState,
  initialAuthActionState,
} from "@/lib/auth/validation";

type OnboardingFormProps = {
  defaultFullName: string;
};

function fieldError(state: AuthActionState, name: string) {
  return state.errors?.[name]?.[0];
}

export function OnboardingForm({ defaultFullName }: OnboardingFormProps) {
  const [state, formAction] = useActionState(
    createWorkspace,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        autoComplete="name"
        defaultValue={state.fields?.fullName ?? defaultFullName}
        error={fieldError(state, "fullName")}
        label="Full name"
        name="fullName"
        placeholder="ZMT Developer"
      />

      <Field
        autoComplete="organization"
        defaultValue={state.fields?.workspaceName}
        error={fieldError(state, "workspaceName")}
        label="Workspace name"
        name="workspaceName"
        placeholder="Alpha"
      />

      {state.message ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Creating workspace">
        Create workspace
      </SubmitButton>
    </form>
  );
}

function Field({
  error,
  label,
  name,
  ...props
}: {
  error?: string;
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <Input
        aria-describedby={`${name}-error`}
        id={name}
        name={name}
        type="text"
        {...props}
      />
      {error ? (
        <p className="text-sm text-destructive" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
