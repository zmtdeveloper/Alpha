import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/data";
import { getInitials } from "@/lib/auth/data";
import type { Enums, Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspace/data";

type AppRole = Enums<"app_role">;

type TeamMemberRow = Pick<
  Tables<"workspace_members">,
  "created_at" | "id" | "role" | "status" | "user_id"
> & {
  profiles: Pick<Tables<"profiles">, "avatar_url" | "full_name"> | null;
};

type InvitationRow = Pick<
  Tables<"invitations">,
  | "accepted_at"
  | "created_at"
  | "email"
  | "expires_at"
  | "id"
  | "revoked_at"
  | "role"
>;

export type TeamMember = {
  avatarUrl: string | null;
  createdAt: string;
  fullName: string;
  id: number;
  initials: string;
  isCurrentUser: boolean;
  role: AppRole;
  status: Enums<"member_status">;
  userId: string;
};

export type TeamInvitation = InvitationRow & {
  state: "accepted" | "expired" | "pending" | "revoked";
};

export type TeamManagementData = {
  canManageTeam: boolean;
  currentRole: AppRole | null;
  invitations: TeamInvitation[];
  members: TeamMember[];
  ownerCount: number;
  workspace: {
    id: number;
    name: string;
    slug: string;
  };
};

export const getTeamManagementData = cache(
  async (workspaceSlug: string): Promise<TeamManagementData> => {
    const [workspace, currentUser] = await Promise.all([
      getWorkspaceBySlug(workspaceSlug),
      getCurrentUser(),
    ]);
    const supabase = await createClient();

    const [membersResult, invitationsResult] = await Promise.all([
      supabase
        .from("workspace_members")
        .select(
          "id, user_id, role, status, created_at, profiles!workspace_members_user_id_fkey(full_name, avatar_url)",
        )
        .eq("workspace_id", workspace.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .returns<TeamMemberRow[]>(),
      supabase
        .from("invitations")
        .select("id, email, role, expires_at, accepted_at, revoked_at, created_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<InvitationRow[]>(),
    ]);

    const members = (membersResult.data ?? []).map((member) => {
      const fullName = member.profiles?.full_name || "Team member";

      return {
        avatarUrl: member.profiles?.avatar_url ?? null,
        createdAt: member.created_at,
        fullName,
        id: member.id,
        initials: getInitials(fullName),
        isCurrentUser: member.user_id === currentUser?.id,
        role: member.role,
        status: member.status,
        userId: member.user_id,
      };
    });
    const currentRole =
      members.find((member) => member.userId === currentUser?.id)?.role ?? null;

    return {
      canManageTeam: currentRole === "owner" || currentRole === "admin",
      currentRole,
      invitations: (invitationsResult.data ?? []).map((invitation) => ({
        ...invitation,
        state: getInvitationState(invitation),
      })),
      members,
      ownerCount: members.filter((member) => member.role === "owner").length,
      workspace,
    };
  },
);

function getInvitationState(invitation: InvitationRow): TeamInvitation["state"] {
  if (invitation.accepted_at) {
    return "accepted";
  }

  if (invitation.revoked_at) {
    return "revoked";
  }

  if (new Date(invitation.expires_at).getTime() <= Date.now()) {
    return "expired";
  }

  return "pending";
}
