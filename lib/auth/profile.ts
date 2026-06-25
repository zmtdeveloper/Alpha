import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TablesInsert } from "@/lib/database.types";

export async function upsertProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  fullName?: string | null,
) {
  const normalizedName = fullName?.trim() || null;
  const profile: TablesInsert<"profiles"> = normalizedName
    ? {
        full_name: normalizedName,
        id: userId,
      }
    : {
        id: userId,
      };

  const { error } = await supabase.from("profiles").upsert(profile, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}
