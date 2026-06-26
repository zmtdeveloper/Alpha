"use client";

import type * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/lib/account/actions";
import {
  type AccountActionState,
  initialAccountActionState,
} from "@/lib/account/validation";

type ProfileFormProps = {
  avatarUrl: string;
  email: string;
  fullName: string;
  initials: string;
  workspaceSlug: string;
};

function fieldError(state: AccountActionState, name: string) {
  return state.errors?.[name]?.[0];
}

export function ProfileForm({
  avatarUrl,
  email,
  fullName,
  initials,
  workspaceSlug,
}: ProfileFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialAccountActionState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(240px,0.36fr)_minmax(0,0.64fr)]">
      <aside className="rounded-md bg-card/70 p-4 text-card-foreground shadow-sm shadow-black/10">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This identity appears in member lists, assignees, and workspace
          activity.
        </p>
      </aside>

      <form action={formAction} className="rounded-md bg-card/70 p-4 shadow-sm shadow-black/10">
        <input name="workspaceSlug" type="hidden" value={workspaceSlug} />

        <div className="grid gap-4">
          <Field
            autoComplete="name"
            defaultValue={state.fields?.fullName ?? fullName}
            error={fieldError(state, "fullName")}
            label="Full name"
            name="fullName"
            placeholder="ZMT Developer"
          />

          <Field
            autoComplete="email"
            defaultValue={email}
            disabled
            label="Email"
            name="email"
            type="email"
          />

          <Field
            autoComplete="url"
            defaultValue={state.fields?.avatarUrl ?? avatarUrl}
            error={fieldError(state, "avatarUrl")}
            label="Avatar URL"
            name="avatarUrl"
            placeholder="https://example.com/avatar.png"
            type="url"
          />
        </div>

        {state.message ? (
          <p
            className={
              state.ok
                ? "mt-4 text-sm text-primary"
                : "mt-4 text-sm text-destructive"
            }
            role="status"
          >
            {state.message}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button disabled={pending} type="submit">
            {pending ? "Saving" : "Save profile"}
          </Button>
        </div>
      </form>
    </section>
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
    <label className="block space-y-2 text-sm" htmlFor={name}>
      <span className="font-medium text-foreground">{label}</span>
      <Input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        id={name}
        name={name}
        type="text"
        {...props}
      />
      {error ? (
        <span className="block text-sm text-destructive" id={`${name}-error`}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
