"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { sendMagicLink } from "@/lib/auth/actions";
import {
  type AuthActionState,
  initialAuthActionState,
} from "@/lib/auth/validation";

type MagicLinkFormProps = {
  nextPath?: string;
};

function fieldError(state: AuthActionState, name: string) {
  return state.errors?.[name]?.[0];
}

export function MagicLinkForm({ nextPath }: MagicLinkFormProps) {
  const [state, formAction] = useActionState(
    sendMagicLink,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4 border-t border-border pt-5">
      <input name="next" type="hidden" value={nextPath ?? ""} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="magic-email">
          Email
        </label>
        <Input
          aria-describedby="magic-email-error"
          autoComplete="email"
          defaultValue={state.fields?.email}
          id="magic-email"
          name="email"
          placeholder="you@company.com"
          type="email"
        />
        {fieldError(state, "email") ? (
          <p className="text-sm text-destructive" id="magic-email-error">
            {fieldError(state, "email")}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Sending">Send magic link</SubmitButton>
    </form>
  );
}
