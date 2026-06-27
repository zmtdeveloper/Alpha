import { z } from "zod";

export const authNextSchema = z
  .string()
  .trim()
  .max(512)
  .optional()
  .transform((value) => sanitizeNextPath(value));

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: authNextSchema,
});

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  next: authNextSchema,
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const passwordUpdateSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be 72 characters or fewer."),
    passwordConfirm: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "Passwords do not match.",
    path: ["passwordConfirm"],
  });

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Full name must be 120 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
  next: authNextSchema,
});

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Full name must be 120 characters or fewer."),
  workspaceName: z
    .string()
    .trim()
    .min(2, "Enter a workspace name.")
    .max(120, "Workspace name must be 120 characters or fewer."),
});

export const inviteTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(24, "Invitation token is invalid.")
    .max(256, "Invitation token is invalid."),
});

export type AuthActionState = {
  errors?: Record<string, string[] | undefined>;
  fields?: Record<string, string>;
  message?: string;
};

export const initialAuthActionState: AuthActionState = {};

export function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
}
