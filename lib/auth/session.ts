import "server-only";

import type { User } from "@supabase/supabase-js";

import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ValidatedUser = {
  email: string;
  id: string;
  name: string;
};

export const expiredSessionMessage = "Session expired. Sign in again.";

export async function getValidatedUser(
  supabase: SupabaseServerClient,
): Promise<ValidatedUser | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return userFromSupabase(data.user);
}

export async function getActionUser(supabase: SupabaseServerClient) {
  const user = await getValidatedUser(supabase);

  if (!user) {
    await supabase.auth.signOut();
  }

  return user;
}

function userFromSupabase(user: User): ValidatedUser {
  const email = user.email ?? "";
  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  return {
    email,
    id: user.id,
    name: fullName || nameFromEmail(email) || "Team member",
  };
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
