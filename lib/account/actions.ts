"use server";

import { revalidatePath } from "next/cache";

import { expiredSessionMessage, getActionUser } from "@/lib/auth/session";
import { formValue } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import {
  type AccountActionState,
  profileSchema,
} from "@/lib/account/validation";

function fieldErrors(error: {
  flatten: () => { fieldErrors: AccountActionState["errors"] };
}) {
  return error.flatten().fieldErrors;
}

function accountMessage(
  message: string,
  fields?: Record<string, string>,
): AccountActionState {
  return {
    fields,
    message,
  };
}

export async function updateProfile(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const fields = {
    avatarUrl: formValue(formData, "avatarUrl"),
    fullName: formValue(formData, "fullName"),
    workspaceSlug: formValue(formData, "workspaceSlug"),
  };
  const parsed = profileSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const supabase = await createClient();
  const user = await getActionUser(supabase);

  if (!user) {
    return accountMessage(expiredSessionMessage, fields);
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      avatar_url: parsed.data.avatarUrl,
      full_name: parsed.data.fullName,
      id: user.id,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    return accountMessage("Could not update your profile.", fields);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      avatar_url: parsed.data.avatarUrl,
      full_name: parsed.data.fullName,
    },
  });

  if (metadataError) {
    console.error("Could not update auth user metadata.", {
      error: metadataError.message,
      userId: user.id,
    });
  }

  revalidatePath(`/${parsed.data.workspaceSlug}`);
  revalidatePath(`/${parsed.data.workspaceSlug}/settings/profile`);

  return {
    fields: {
      avatarUrl: parsed.data.avatarUrl ?? "",
      fullName: parsed.data.fullName,
      workspaceSlug: parsed.data.workspaceSlug,
    },
    message: "Profile updated.",
    ok: true,
  };
}
