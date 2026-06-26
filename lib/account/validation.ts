import { z } from "zod";

export const profileSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .max(2048, "Avatar URL must be 2048 characters or fewer.")
    .refine((value) => value === "" || isHttpUrl(value), {
      message: "Enter a valid http or https avatar URL.",
    })
    .transform((value) => value || null),
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Full name must be 120 characters or fewer."),
  workspaceSlug: z
    .string()
    .trim()
    .min(1, "Workspace is required.")
    .max(120, "Workspace is invalid.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Workspace is invalid."),
});

export type AccountActionState = {
  errors?: Record<string, string[] | undefined>;
  fields?: Record<string, string>;
  message?: string;
  ok?: boolean;
};

export const initialAccountActionState: AccountActionState = {};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
