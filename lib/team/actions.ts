"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";

import { hashInviteToken } from "@/lib/auth/invitations";
import { expiredSessionMessage, getActionUser } from "@/lib/auth/session";
import type { Enums, Tables } from "@/lib/database.types";
import { sendInvitationEmail } from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";
import {
  formString,
  invitationMutationSchema,
  inviteMemberSchema,
  teamMemberMutationSchema,
  type TeamActionState,
  updateMemberRoleSchema,
} from "@/lib/team/validation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AppRole = Enums<"app_role">;
type WorkspaceMemberRow = Pick<
  Tables<"workspace_members">,
  "id" | "role" | "status" | "user_id" | "workspace_id"
>;

type TeamActionContext =
  | {
      actorRole: Extract<AppRole, "admin" | "owner">;
      actorName: string;
      error?: never;
      supabase: SupabaseServerClient;
      userId: string;
      workspace: {
        id: number;
        name: string;
        slug: string;
      };
    }
  | {
      actorRole?: never;
      error: string;
      supabase: SupabaseServerClient;
      userId?: never;
      workspace?: never;
    };

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;

function fieldErrors(error: {
  flatten: () => { fieldErrors: TeamActionState["errors"] };
}) {
  return error.flatten().fieldErrors;
}

function actionMessage(message: string, fields?: Record<string, string>) {
  return {
    fields,
    message,
  } satisfies TeamActionState;
}

function okMessage(message: string, fields?: Record<string, string>) {
  return {
    fields,
    message,
    ok: true,
  } satisfies TeamActionState;
}

async function requireTeamManager(
  workspaceSlug: string,
): Promise<TeamActionContext> {
  const supabase = await createClient();
  const user = await getActionUser(supabase);

  if (!user) {
    return { error: expiredSessionMessage, supabase };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return { error: "Workspace was not found or access was denied.", supabase };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (
    membershipError ||
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return { error: "You do not have permission to manage this team.", supabase };
  }

  return {
    actorRole: membership.role,
    actorName: user.name,
    supabase,
    userId: user.id,
    workspace,
  };
}

function hasActionError(
  context: TeamActionContext,
): context is Extract<TeamActionContext, { error: string }> {
  return typeof context.error === "string";
}

function canManageRole(actorRole: AppRole, targetRole: AppRole) {
  return actorRole === "owner" || targetRole !== "owner";
}

export async function createInvitation(
  _state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const fields = {
    email: formString(formData, "email"),
    role: formString(formData, "role"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  };
  const parsed = inviteMemberSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const context = await requireTeamManager(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error, fields);
  }

  if (!canManageRole(context.actorRole, parsed.data.role)) {
    return actionMessage("Only owners can invite another owner.", fields);
  }

  const { data: existingInvite } = await context.supabase
    .from("invitations")
    .select("id")
    .eq("workspace_id", context.workspace.id)
    .eq("email", parsed.data.email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .maybeSingle();

  if (existingInvite) {
    return actionMessage("This email already has a pending invitation.", fields);
  }

  const token = createInviteToken();
  const inviteUrl = await buildInviteUrl(token);
  const expiresAt = new Date(Date.now() + invitationLifetimeMs).toISOString();
  const { data: invitation, error } = await context.supabase
    .from("invitations")
    .insert({
      email: parsed.data.email,
      expires_at: expiresAt,
      invited_by: context.userId,
      role: parsed.data.role,
      token_hash: hashInviteToken(token),
      workspace_id: context.workspace.id,
    })
    .select("id")
    .single();

  if (error || !invitation) {
    return actionMessage("Invitation could not be created.", fields);
  }

  after(async () => {
    await sendInvitationEmail({
      email: parsed.data.email,
      expiresAt,
      invitationId: invitation.id,
      inviteUrl,
      inviterName: context.actorName,
      role: parsed.data.role,
      workspaceName: context.workspace.name,
      workspaceSlug: context.workspace.slug,
    });
  });

  revalidateMembers(parsed.data.workspaceSlug);

  return okMessage("Invitation created and email queued.", {
    ...fields,
    inviteUrl,
  });
}

export async function resendInvitation(
  input: unknown,
): Promise<TeamActionState> {
  const parsed = invitationMutationSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Invitation could not be resent.");
  }

  const context = await requireTeamManager(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const invitation = await getScopedInvitation(
    context.supabase,
    context.workspace.id,
    parsed.data.invitationId,
  );

  if (!invitation || invitation.accepted_at || invitation.revoked_at) {
    return actionMessage("Choose a pending invitation.");
  }

  if (!canManageRole(context.actorRole, invitation.role)) {
    return actionMessage("Only owners can resend owner invitations.");
  }

  const token = createInviteToken();
  const inviteUrl = await buildInviteUrl(token);
  const expiresAt = new Date(Date.now() + invitationLifetimeMs).toISOString();
  const { error } = await context.supabase
    .from("invitations")
    .update({
      expires_at: expiresAt,
      token_hash: hashInviteToken(token),
    })
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.invitationId)
    .is("accepted_at", null)
    .is("revoked_at", null);

  if (error) {
    return actionMessage("Invitation could not be resent.");
  }

  after(async () => {
    await sendInvitationEmail({
      email: invitation.email,
      expiresAt,
      invitationId: invitation.id,
      inviteUrl,
      inviterName: context.actorName,
      role: invitation.role,
      workspaceName: context.workspace.name,
      workspaceSlug: context.workspace.slug,
    });
  });

  revalidateMembers(parsed.data.workspaceSlug);

  return okMessage("Invitation email resent.", { inviteUrl });
}

export async function revokeInvitation(
  input: unknown,
): Promise<TeamActionState> {
  const parsed = invitationMutationSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Invitation could not be revoked.");
  }

  const context = await requireTeamManager(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const invitation = await getScopedInvitation(
    context.supabase,
    context.workspace.id,
    parsed.data.invitationId,
  );

  if (!invitation || invitation.accepted_at || invitation.revoked_at) {
    return actionMessage("Choose a pending invitation.");
  }

  if (!canManageRole(context.actorRole, invitation.role)) {
    return actionMessage("Only owners can revoke owner invitations.");
  }

  const { error } = await context.supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.invitationId)
    .is("accepted_at", null)
    .is("revoked_at", null);

  if (error) {
    return actionMessage("Invitation could not be revoked.");
  }

  revalidateMembers(parsed.data.workspaceSlug);

  return okMessage("Invitation revoked.");
}

export async function updateMemberRole(
  input: unknown,
): Promise<TeamActionState> {
  const parsed = updateMemberRoleSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Role could not be changed.");
  }

  const context = await requireTeamManager(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const member = await getScopedMember(
    context.supabase,
    context.workspace.id,
    parsed.data.memberId,
  );

  if (!member || member.status !== "active") {
    return actionMessage("Choose an active workspace member.");
  }

  if (
    !canManageRole(context.actorRole, member.role) ||
    !canManageRole(context.actorRole, parsed.data.role)
  ) {
    return actionMessage("Only owners can change owner roles.");
  }

  const { error } = await context.supabase
    .from("workspace_members")
    .update({ role: parsed.data.role })
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.memberId)
    .eq("status", "active");

  if (error) {
    return actionMessage("Role could not be changed. Keep at least one owner.");
  }

  revalidateMembers(parsed.data.workspaceSlug);

  return okMessage("Role changed.");
}

export async function removeMember(input: unknown): Promise<TeamActionState> {
  const parsed = teamMemberMutationSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Member could not be removed.");
  }

  const context = await requireTeamManager(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const member = await getScopedMember(
    context.supabase,
    context.workspace.id,
    parsed.data.memberId,
  );

  if (!member || member.status !== "active") {
    return actionMessage("Choose an active workspace member.");
  }

  if (!canManageRole(context.actorRole, member.role)) {
    return actionMessage("Only owners can remove owners.");
  }

  const { error } = await context.supabase
    .from("workspace_members")
    .update({ status: "removed" })
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.memberId)
    .eq("status", "active");

  if (error) {
    return actionMessage("Member could not be removed. Keep at least one owner.");
  }

  revalidateMembers(parsed.data.workspaceSlug);

  return okMessage("Member removed.");
}

async function getScopedMember(
  supabase: SupabaseServerClient,
  workspaceId: number,
  memberId: number,
) {
  const { data } = await supabase
    .from("workspace_members")
    .select("id, role, status, user_id, workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("id", memberId)
    .maybeSingle<WorkspaceMemberRow>();

  return data;
}

async function getScopedInvitation(
  supabase: SupabaseServerClient,
  workspaceId: number,
  invitationId: number,
) {
  const { data } = await supabase
    .from("invitations")
    .select("accepted_at, email, id, revoked_at, role")
    .eq("workspace_id", workspaceId)
    .eq("id", invitationId)
    .maybeSingle();

  return data;
}

async function buildInviteUrl(token: string) {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  return `${origin}/invite/${token}`;
}

function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

function revalidateMembers(workspaceSlug: string) {
  revalidatePath(`/${workspaceSlug}/settings/members`);
}
