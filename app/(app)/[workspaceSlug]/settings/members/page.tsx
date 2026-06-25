import { MailPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InviteMemberDialog,
  TeamManagement,
} from "@/components/workspace/team-management";
import { getTeamManagementData } from "@/lib/team/data";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const data = await getTeamManagementData(workspaceSlug);

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
        {data.canManageTeam ? (
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
        ) : (
          <div className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground">
            <Users className="size-4" />
            Read-only access
          </div>
        )}
      </section>

      <TeamManagement
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
