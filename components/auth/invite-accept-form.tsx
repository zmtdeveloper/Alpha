"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { acceptInvitation } from "@/lib/auth/actions";
import { initialAuthActionState } from "@/lib/auth/validation";

type InviteAcceptFormProps = {
  token: string;
};

export function InviteAcceptForm({ token }: InviteAcceptFormProps) {
  const [state, formAction] = useActionState(
    acceptInvitation,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input name="token" type="hidden" value={token} />

      {state.message ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Joining workspace">
        Join workspace
      </SubmitButton>
    </form>
  );
}
