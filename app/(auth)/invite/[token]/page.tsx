import Link from "next/link";

import { InviteAcceptForm } from "@/components/auth/invite-accept-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/data";
import { getInvitationPreview } from "@/lib/auth/invitations";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitePath = `/invite/${encodeURIComponent(token)}`;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthPageShell eyebrow="Workspace invitation" title="Join a workspace">
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Sign in or create an account with the invited email address to
            continue.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(invitePath)}`}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/signup?next=${encodeURIComponent(invitePath)}`}>
                Create account
              </Link>
            </Button>
          </div>
        </div>
      </AuthPageShell>
    );
  }

  const invitation = await getInvitationPreview(token);

  if (!invitation) {
    return (
      <AuthPageShell eyebrow="Workspace invitation" title="Invite unavailable">
        <p className="text-sm leading-6 text-muted-foreground">
          This invitation is invalid, expired, revoked, or belongs to a
          different email address.
        </p>
      </AuthPageShell>
    );
  }

  const isClosed =
    Boolean(invitation.acceptedAt) ||
    Boolean(invitation.revokedAt) ||
    invitation.isExpired;

  return (
    <AuthPageShell
      eyebrow="Workspace invitation"
      title={`Join ${invitation.workspaceName}`}
    >
      <div className="space-y-4">
        <dl className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-medium">{invitation.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium capitalize">{invitation.role}</dd>
          </div>
        </dl>

        {isClosed ? (
          <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            This invitation can no longer be accepted.
          </p>
        ) : (
          <InviteAcceptForm token={token} />
        )}
      </div>
    </AuthPageShell>
  );
}
