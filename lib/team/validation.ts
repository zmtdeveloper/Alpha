import { z } from "zod";

import { workspaceSlugSchema } from "@/lib/workspace/validation";

export const teamRoleSchema = z.enum(["owner", "admin", "member"]);

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  role: teamRoleSchema,
  workspaceSlug: workspaceSlugSchema,
});

export const teamMemberMutationSchema = z.object({
  memberId: z.coerce.number().int().positive(),
  workspaceSlug: workspaceSlugSchema,
});

export const updateMemberRoleSchema = teamMemberMutationSchema.extend({
  role: teamRoleSchema,
});

export const invitationMutationSchema = z.object({
  invitationId: z.coerce.number().int().positive(),
  workspaceSlug: workspaceSlugSchema,
});

export type TeamActionState = {
  errors?: Record<string, string[] | undefined>;
  fields?: Record<string, string>;
  message?: string;
  ok?: boolean;
};

export const initialTeamActionState: TeamActionState = {};

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
