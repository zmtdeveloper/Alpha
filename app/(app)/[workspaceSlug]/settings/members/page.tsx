import { MailPlus, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  InviteMemberDialog,
  TeamManagement,
} from "@/components/workspace/team-management";
import { getWorkspaceLimitState } from "@/lib/billing/data";
import { getTeamManagementData } from "@/lib/team/data";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const [data, limits] = await Promise.all([
    getTeamManagementData(workspaceSlug),
    getWorkspaceLimitState(workspaceSlug),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Members
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage active access and pending invitations for {data.workspace.name}.
          </p>
        </div>
        {data.canManageTeam && limits.canCreateInvitation ? (
          <InviteMemberDialog
            canInviteOwners={data.currentRole === "owner"}
            trigger={
              <Button>
                <MailPlus />
                Invite
              </Button>
            }
            workspaceSlug={workspaceSlug}
          />
        ) : data.canManageTeam ? (
          <Button disabled>
            <MailPlus />
            Invite
          </Button>
        ) : (
          <div className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground">
            <Users className="size-4" />
            Read-only access
          </div>
        )}
      </section>

      {data.canManageTeam && !limits.canCreateInvitation ? (
        <section className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {limits.plan.name} allows {limits.memberLimit} active{" "}
          {limits.memberLimit === 1 ? "user" : "users"} including pending
          invites; this workspace has {limits.reservedMemberCount} reserved
          seats.{" "}
          {limits.canResendInvitation
            ? "New invitations are blocked until a seat opens or the workspace is upgraded."
            : "New and resent invitations are blocked until usage is under the limit or the workspace is upgraded."}{" "}
          <Link
            className="font-medium underline underline-offset-4"
            href={`/${workspaceSlug}/settings/billing`}
          >
            Open billing
          </Link>
          .
        </section>
      ) : null}

      <TeamManagement
        canResendInvitation={limits.canResendInvitation}
        canManageTeam={data.canManageTeam}
        currentRole={data.currentRole}
        invitations={data.invitations}
        members={data.members}
        ownerCount={data.ownerCount}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
