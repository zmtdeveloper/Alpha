import type { Enums } from "@/lib/database.types";

export type BillingPlanId = Enums<"billing_plan">;
export type BillingStatus = Enums<"billing_status">;

export type BillingPlanLimits = {
  memberLimit: number | null;
  projectLimit: number | null;
};

export type BillingPlan = {
  description: string;
  features: string[];
  id: BillingPlanId;
  memberLimitLabel: string;
  name: string;
  price: string;
  projectLimitLabel: string;
};

export const billingPlanLimits = {
  free: {
    memberLimit: 1,
    projectLimit: 1,
  },
  lite: {
    memberLimit: 3,
    projectLimit: 10,
  },
  pro: {
    memberLimit: null,
    projectLimit: null,
  },
} satisfies Record<BillingPlanId, BillingPlanLimits>;

export const billingPlans = [
  {
    description: "For a solo workspace getting projects and boards into shape.",
    features: ["Core projects and boards", "Task labels and assignees", "Workspace settings"],
    id: "free",
    memberLimitLabel: "1 active user",
    name: "Free",
    price: "$0",
    projectLimitLabel: "1 project",
  },
  {
    description: "For small teams that need shared planning without extra process.",
    features: ["Owner plus 2 teammates", "10 workspace projects", "Team invitations"],
    id: "lite",
    memberLimitLabel: "3 active users",
    name: "Lite",
    price: "$19",
    projectLimitLabel: "10 projects",
  },
  {
    description: "For growing teams that want workspace capacity out of the way.",
    features: ["Unlimited active users", "Unlimited projects", "Future AI workflow gates"],
    id: "pro",
    memberLimitLabel: "Unlimited users",
    name: "Pro",
    price: "$49",
    projectLimitLabel: "Unlimited projects",
  },
] satisfies BillingPlan[];

export function getBillingPlan(planId: BillingPlanId) {
  return billingPlans.find((plan) => plan.id === planId) ?? billingPlans[0];
}

export function getPlanLimits(planId: BillingPlanId) {
  return billingPlanLimits[planId];
}

export function isPaidBillingPlan(planId: BillingPlanId) {
  return planId === "lite" || planId === "pro";
}

export function isPaidBillingStatus(status: BillingStatus) {
  return status === "active" || status === "trialing";
}

export function getEffectiveBillingPlan(
  planId: BillingPlanId | null | undefined,
  status: BillingStatus | null | undefined,
): BillingPlanId {
  if (planId && isPaidBillingPlan(planId) && status && isPaidBillingStatus(status)) {
    return planId;
  }

  return "free";
}

export function formatUsageLimit(value: number, limit: number | null) {
  return limit === null ? `${value} / Unlimited` : `${value} / ${limit}`;
}
