import "server-only";

import { createHash } from "node:crypto";

import type { Enums, Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type InvitationPreviewRow = Pick<
  Tables<"invitations">,
  "accepted_at" | "email" | "expires_at" | "revoked_at" | "role"
> & {
  workspaces: Pick<Tables<"workspaces">, "name" | "slug"> | null;
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
    .from("invitations")
    .select(
      "email, role, expires_at, accepted_at, revoked_at, workspaces!inner(name, slug)",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle()
    .returns<InvitationPreviewRow | null>();

  if (error || !data?.workspaces) {
    return null;
  }

  return {
    acceptedAt: data.accepted_at,
    email: data.email,
    expiresAt: data.expires_at,
    isExpired: new Date(data.expires_at).getTime() <= Date.now(),
    revokedAt: data.revoked_at,
    role: data.role,
    workspaceName: data.workspaces.name,
    workspaceSlug: data.workspaces.slug,
  };
}
