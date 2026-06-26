import "server-only";

import { createHash } from "node:crypto";

import type { Enums } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type InvitationPreviewRow = {
  accepted_at: string | null;
  email: string;
  expires_at: string;
  revoked_at: string | null;
  role: Enums<"app_role">;
  workspace_name: string;
  workspace_slug: string;
};

export type InvitationPreview = {
  acceptedAt: string | null;
  email: string;
  expiresAt: string;
  isExpired: boolean;
  revokedAt: string | null;
  role: Enums<"app_role">;
  workspaceName: string;
  workspaceSlug: string;
};

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function getInvitationPreview(token: string) {
  const supabase = await createClient();
  const tokenHash = hashInviteToken(token);

  const { data, error } = await supabase
    .rpc("get_workspace_invitation_preview", {
      p_token_hash: tokenHash,
    })
    .maybeSingle()
    .returns<InvitationPreviewRow | null>();

  if (error || !data) {
    return null;
  }

  return {
    acceptedAt: data.accepted_at,
    email: data.email,
    expiresAt: data.expires_at,
    isExpired: new Date(data.expires_at).getTime() <= Date.now(),
    revokedAt: data.revoked_at,
    role: data.role,
    workspaceName: data.workspace_name,
    workspaceSlug: data.workspace_slug,
  };
}
