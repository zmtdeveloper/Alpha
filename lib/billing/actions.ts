"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getActionUser } from "@/lib/auth/session";
import type { Tables } from "@/lib/database.types";
import {
  createWorkspaceCheckoutSession,
  createWorkspacePortalSession,
} from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { workspaceSlugSchema } from "@/lib/workspace/validation";

type BillingRow = Pick<
  Tables<"workspace_billing">,
  "status" | "stripe_customer_id" | "stripe_subscription_id"
>;

const checkoutActionSchema = z.object({
  plan: z.enum(["lite", "pro"]),
  workspaceSlug: workspaceSlugSchema,
});

const portalActionSchema = z.object({
  workspaceSlug: workspaceSlugSchema,
});

export async function startBillingCheckout(formData: FormData) {
  const parsed = checkoutActionSchema.safeParse({
    plan: formString(formData, "plan"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  });

  if (!parsed.success) {
    redirect("/pricing?billing=invalid-request");
  }

  const context = await requireBillingOwner(parsed.data.workspaceSlug);
  const origin = await getRequestOrigin();
  let redirectUrl: string | null = null;

  try {
    if (shouldUseCustomerPortal(context.billing)) {
      const session = await createWorkspacePortalSession({
        customerId: context.billing.stripe_customer_id,
        returnUrl: `${origin}/${context.workspace.slug}/settings/billing`,
      });
      redirectUrl = session.url;
    } else {
      const session = await createWorkspaceCheckoutSession({
        customerId: context.billing?.stripe_customer_id ?? null,
        origin,
        plan: parsed.data.plan,
        user: context.user,
        workspace: context.workspace,
      });
      redirectUrl = session.url;
    }
  } catch (error) {
    console.error("Stripe billing session could not be created", error);
    redirectToBilling(context.workspace.slug, "configuration-error");
  }

  if (!redirectUrl) {
    redirectToBilling(context.workspace.slug, "configuration-error");
  }

  redirect(redirectUrl);
}

export async function openBillingPortal(formData: FormData) {
  const parsed = portalActionSchema.safeParse({
    workspaceSlug: formString(formData, "workspaceSlug"),
  });

  if (!parsed.success) {
    redirect("/pricing?billing=invalid-request");
  }

  const context = await requireBillingOwner(parsed.data.workspaceSlug);
  const customerId = context.billing?.stripe_customer_id;

  if (!customerId) {
    redirectToBilling(context.workspace.slug, "no-customer");
  }

  const origin = await getRequestOrigin();
  let redirectUrl: string | null = null;

  try {
    const session = await createWorkspacePortalSession({
      customerId,
      returnUrl: `${origin}/${context.workspace.slug}/settings/billing`,
    });
    redirectUrl = session.url;
  } catch (error) {
    console.error("Stripe customer portal could not be created", error);
    redirectToBilling(context.workspace.slug, "configuration-error");
  }

  if (!redirectUrl) {
    redirectToBilling(context.workspace.slug, "configuration-error");
  }

  redirect(redirectUrl);
}

async function requireBillingOwner(workspaceSlug: string) {
  const supabase = await createClient();
  const user = await getActionUser(supabase);

  if (!user) {
    redirect(`/login?next=/${workspaceSlug}/settings/billing`);
  }

  if (!user.email) {
    redirectToBilling(workspaceSlug, "missing-email");
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    redirectToBilling(workspaceSlug, "not-found");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError || membership?.role !== "owner") {
    redirectToBilling(workspace.slug, "owner-required");
  }

  const admin = createAdminClient();
  const { data: billing, error: billingError } = await admin
    .from("workspace_billing")
    .select("status, stripe_customer_id, stripe_subscription_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle<BillingRow>();

  if (billingError) {
    throw billingError;
  }

  return {
    billing,
    user,
    workspace,
  };
}

function shouldUseCustomerPortal(
  billing: BillingRow | null,
): billing is BillingRow & {
  stripe_customer_id: string;
  stripe_subscription_id: string;
} {
  if (!billing?.stripe_customer_id || !billing.stripe_subscription_id) {
    return false;
  }

  return billing.status !== "inactive" && billing.status !== "canceled";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  return origin.replace(/\/$/, "");
}

function redirectToBilling(workspaceSlug: string, code: string): never {
  redirect(`/${workspaceSlug}/settings/billing?billing=${code}`);
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
