"use client";

import type * as React from "react";
import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { login, signup } from "@/lib/auth/actions";
import {
  type AuthActionState,
  initialAuthActionState,
} from "@/lib/auth/validation";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

function fieldError(state: AuthActionState, name: string) {
  return state.errors?.[name]?.[0];
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState(action, initialAuthActionState);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-4">
      <input name="next" type="hidden" value={nextPath ?? ""} />

      {isSignup ? (
        <Field
          autoComplete="name"
          defaultValue={state.fields?.fullName}
          error={fieldError(state, "fullName")}
          label="Full name"
          name="fullName"
          placeholder="ZMT Developer"
          type="text"
        />
      ) : null}

      <Field
        autoComplete="email"
        defaultValue={state.fields?.email}
        error={fieldError(state, "email")}
        label="Email"
        name="email"
        placeholder="you@company.com"
        type="email"
      />

      <Field
        autoComplete={isSignup ? "new-password" : "current-password"}
        error={fieldError(state, "password")}
        label="Password"
        name="password"
        placeholder="Minimum 8 characters"
        type="password"
      />

      {state.message ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel={isSignup ? "Creating" : "Signing in"}>
        {isSignup ? "Create account" : "Sign in"}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New to Alpha?"}{" "}
        <Link
          className="font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href={
            isSignup
              ? nextHref("/login", nextPath)
              : nextHref("/signup", nextPath)
          }
        >
          {isSignup ? "Sign in" : "Create account"}
        </Link>
      </p>
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

function nextHref(pathname: string, nextPath?: string) {
  if (!nextPath) {
    return pathname;
  }

  return `${pathname}?next=${encodeURIComponent(nextPath)}`;
}
