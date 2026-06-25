import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import type { Enums, Tables } from "@/lib/database.types";
import { getValidatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type WorkspaceMembershipRow = {
  role: Enums<"app_role">;
  workspaces: Pick<Tables<"workspaces">, "id" | "name" | "slug"> | null;
};

export type CurrentUser = {
  email: string;
  id: string;
  name: string;
};

export type WorkspaceSummary = {
  id: number;
  name: string;
  role: Enums<"app_role">;
  slug: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  return getValidatedUser(supabase);
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
});

export const getWorkspaceMemberships = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces!inner(id, name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<WorkspaceMembershipRow[]>();

  if (error || !data) {
    return [];
  }

  return data.flatMap((membership) => {
    if (!membership.workspaces) {
      return [];
    }

    return {
      id: membership.workspaces.id,
      name: membership.workspaces.name,
      role: membership.role,
      slug: membership.workspaces.slug,
    };
  });
});

export async function redirectToWorkspaceOrOnboarding() {
  const workspaces = await getWorkspaceMemberships();
  const firstWorkspace = workspaces[0];

  if (!firstWorkspace) {
    redirect("/onboarding");
  }

  redirect(`/${firstWorkspace.slug}`);
}

export async function getWorkspaceShellContext(workspaceSlug: string) {
  const [user, profile, workspaces] = await Promise.all([
    requireCurrentUser(),
    getCurrentProfile(),
    getWorkspaceMemberships(),
  ]);

  const workspace = workspaces.find((item) => item.slug === workspaceSlug);

  if (!workspace) {
    if (workspaces.length === 0) {
      redirect("/onboarding");
    }

    notFound();
  }

  return {
    user: {
      email: user.email,
      fullName: profile?.full_name || user.name,
      initials: getInitials(profile?.full_name || user.name),
    },
    workspace,
    workspaces,
  };
}

export function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "T";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}
