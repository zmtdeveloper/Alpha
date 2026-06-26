import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/data";
import type { Enums, Tables } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspace/data";
import {
  getBillingPlan,
  getEffectiveBillingPlan,
  getPlanLimits,
  type BillingPlanId,
} from "@/lib/billing/plans";

type BillingRow = Pick<
  Tables<"workspace_billing">,
  | "cancel_at_period_end"
  | "current_period_end"
  | "current_period_start"
  | "last_stripe_event_created"
  | "plan"
  | "status"
  | "stripe_customer_id"
  | "stripe_price_id"
  | "stripe_subscription_id"
>;

type MembershipRow = {
  role: Enums<"app_role">;
};

export type WorkspaceBillingData = {
  activeMemberCount: number;
  billing: BillingRow;
  canCreateInvitation: boolean;
  canCreateProject: boolean;
  canManageBilling: boolean;
  canResendInvitation: boolean;
  currentRole: Enums<"app_role">;
  effectivePlan: BillingPlanId;
  memberLimit: number | null;
  pendingInvitationCount: number;
  projectCount: number;
  projectLimit: number | null;
  reservedMemberCount: number;
  workspace: {
    id: number;
    name: string;
    slug: string;
  };
};

const defaultBilling: BillingRow = {
  cancel_at_period_end: false,
  current_period_end: null,
  current_period_start: null,
  last_stripe_event_created: null,
  plan: "free",
  status: "inactive",
  stripe_customer_id: null,
  stripe_price_id: null,
  stripe_subscription_id: null,
};

export const getWorkspaceBillingData = cache(
  async (workspaceSlug: string): Promise<WorkspaceBillingData> => {
    const [workspace, currentUser] = await Promise.all([
      getWorkspaceBySlug(workspaceSlug),
      getCurrentUser(),
    ]);

    if (!currentUser) {
      notFound();
    }

    const supabase = await createClient();
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace.id)
      .eq("user_id", currentUser.id)
      .eq("status", "active")
      .maybeSingle<MembershipRow>();

    if (membershipError || !membership) {
      notFound();
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const [
      billingResult,
      activeMemberResult,
      pendingInvitationResult,
      projectResult,
    ] = await Promise.all([
      admin
        .from("workspace_billing")
        .select(
          "cancel_at_period_end, current_period_end, current_period_start, last_stripe_event_created, plan, status, stripe_customer_id, stripe_price_id, stripe_subscription_id",
        )
        .eq("workspace_id", workspace.id)
        .maybeSingle<BillingRow>(),
      admin
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "active"),
      admin
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", now),
      admin
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
    ]);

    if (
      billingResult.error ||
      activeMemberResult.error ||
      pendingInvitationResult.error ||
      projectResult.error
    ) {
      notFound();
    }

    const billing = billingResult.data ?? defaultBilling;
    const effectivePlan = getEffectiveBillingPlan(billing.plan, billing.status);
    const limits = getPlanLimits(effectivePlan);
    const activeMemberCount = activeMemberResult.count ?? 0;
    const pendingInvitationCount = pendingInvitationResult.count ?? 0;
    const projectCount = projectResult.count ?? 0;
    const reservedMemberCount = activeMemberCount + pendingInvitationCount;

    return {
      activeMemberCount,
      billing,
      canCreateInvitation:
        limits.memberLimit === null || reservedMemberCount < limits.memberLimit,
      canCreateProject:
        limits.projectLimit === null || projectCount < limits.projectLimit,
      canManageBilling: membership.role === "owner",
      canResendInvitation:
        limits.memberLimit === null || reservedMemberCount <= limits.memberLimit,
      currentRole: membership.role,
      effectivePlan,
      memberLimit: limits.memberLimit,
      pendingInvitationCount,
      projectCount,
      projectLimit: limits.projectLimit,
      reservedMemberCount,
      workspace,
    };
  },
);

export const getWorkspaceLimitState = cache(async (workspaceSlug: string) => {
  const data = await getWorkspaceBillingData(workspaceSlug);
  const plan = getBillingPlan(data.effectivePlan);

  return {
    canCreateInvitation: data.canCreateInvitation,
    canCreateProject: data.canCreateProject,
    canResendInvitation: data.canResendInvitation,
    memberLimit: data.memberLimit,
    plan,
    projectLimit: data.projectLimit,
    reservedMemberCount: data.reservedMemberCount,
  };
});
