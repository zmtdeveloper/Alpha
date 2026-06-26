"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSlug } from "@/lib/auth/slug";
import { hashInviteToken } from "@/lib/auth/invitations";
import { upsertProfile } from "@/lib/auth/profile";
import { expiredSessionMessage, getActionUser } from "@/lib/auth/session";
import { planLimitErrorMessage } from "@/lib/billing/errors";
import {
  type AuthActionState,
  formValue,
  inviteTokenSchema,
  loginSchema,
  onboardingSchema,
  signupSchema,
} from "@/lib/auth/validation";
import { sendWelcomeEmail } from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";

function fieldErrors(error: { flatten: () => { fieldErrors: AuthActionState["errors"] } }) {
  return error.flatten().fieldErrors;
}

function authMessage(message: string, fields?: Record<string, string>) {
  return {
    fields,
    message,
  } satisfies AuthActionState;
}

async function requireActionUser() {
  const supabase = await createClient();
  const user = await getActionUser(supabase);

  return {
    supabase,
    user,
  };
}

export async function login(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fields = {
    email: formValue(formData, "email"),
    next: formValue(formData, "next"),
  };
  const parsed = loginSchema.safeParse({
    email: fields.email,
    next: fields.next,
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return authMessage("Email or password is incorrect.", fields);
  }

  const fullName =
    typeof data.user.user_metadata.full_name === "string"
      ? data.user.user_metadata.full_name
      : null;

  await upsertProfile(supabase, data.user.id, fullName);

  redirect(parsed.data.next ?? "/onboarding");
}

export async function signup(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fields = {
    email: formValue(formData, "email"),
    fullName: formValue(formData, "fullName"),
    next: formValue(formData, "next"),
  };
  const parsed = signupSchema.safeParse({
    email: fields.email,
    fullName: fields.fullName,
    next: fields.next,
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return authMessage(
      error?.message ?? "Could not create the account.",
      fields,
    );
  }

  if (!data.session) {
    return authMessage("Check your email to confirm your account.", fields);
  }

  await upsertProfile(supabase, data.user.id, parsed.data.fullName);

  redirect(parsed.data.next ?? "/onboarding");
}

export async function createWorkspace(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fields = {
    fullName: formValue(formData, "fullName"),
    workspaceName: formValue(formData, "workspaceName"),
  };
  const parsed = onboardingSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const { supabase, user } = await requireActionUser();

  if (!user) {
    return authMessage(expiredSessionMessage, fields);
  }

  const { data: workspace, error } = await supabase.rpc(
    "create_workspace_for_current_user",
    {
      p_full_name: parsed.data.fullName,
      p_workspace_name: parsed.data.workspaceName,
      p_workspace_slug: createSlug(parsed.data.workspaceName),
    },
  );

  if (error || !workspace) {
    return authMessage(
      isStaleSessionError(error)
        ? expiredSessionMessage
        : "Could not create the workspace.",
      fields,
    );
  }

  const workspaceUrl = await buildWorkspaceUrl(workspace.slug);

  after(async () => {
    await sendWelcomeEmail({
      email: user.email,
      fullName: parsed.data.fullName,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      workspaceUrl,
    });
  });

  redirect(`/${workspace.slug}`);
}

export async function acceptInvitation(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = inviteTokenSchema.safeParse({
    token: formValue(formData, "token"),
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      message: "Invitation token is invalid.",
    };
  }

  const { supabase, user } = await requireActionUser();

  if (!user) {
    return authMessage(expiredSessionMessage);
  }

  const { data, error } = await supabase
    .rpc("accept_workspace_invitation", {
      p_token_hash: hashInviteToken(parsed.data.token),
    })
    .single();

  if (error || !data) {
    return authMessage(
      planLimitErrorMessage(error) ?? "Could not accept this invitation.",
    );
  }

  redirect(`/${data.workspace_slug}`);
}

function isStaleSessionError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "23503" ||
    message.includes("profiles_id_fkey") ||
    message.includes("auth.users")
  );
}

async function buildWorkspaceUrl(workspaceSlug: string) {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  return `${origin}/${workspaceSlug}`;
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
