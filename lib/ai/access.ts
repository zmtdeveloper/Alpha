import "server-only";

import { cache } from "react";

import { getActionUser } from "@/lib/auth/session";
import { getEffectiveBillingPlan, type BillingPlanId } from "@/lib/billing/plans";
import type { Tables } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getNvidiaConfig,
  isNvidiaConfigReady,
} from "@/lib/ai/nvidia";
import type { WorkspaceAiAvailability } from "@/lib/ai/types";

type WorkspaceRow = {
  id: number;
  name: string;
  slug: string;
};

type WorkspaceBillingRow = {
  plan: BillingPlanId;
  status: Tables<"workspace_billing">["status"];
};

export const getWorkspaceAiAvailability = cache(
  async (effectivePlan: BillingPlanId): Promise<WorkspaceAiAvailability> => {
    const config = getNvidiaConfig();

    if (!config || !isNvidiaConfigReady(config)) {
      return {
        enabled: false,
        message: "AI is not configured yet.",
        reason: "not-configured",
      };
    }

    if (effectivePlan !== "pro") {
      return {
        enabled: false,
        message: "AI is available on Pro workspaces only.",
        reason: "wrong-plan",
      };
    }

    return {
      enabled: true,
      message: "Ask AI is ready.",
      reason: null,
    };
  },
);

export async function requireWorkspaceAiAccess(workspaceSlug: string) {
  const supabase = await createClient();
  const user = await getActionUser(supabase);

  if (!user) {
    return {
      error: {
        code: "not-authorized" as const,
        message: "Session expired. Sign in again.",
      },
    };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle<WorkspaceRow>();

  if (!workspace) {
    return {
      error: {
        code: "not-authorized" as const,
        message: "Workspace was not found or access was denied.",
      },
      userId: user.id,
    };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    return {
      error: {
        code: "not-authorized" as const,
        message: "Workspace access was denied.",
      },
      userId: user.id,
      workspace,
    };
  }

  const admin = createAdminClient();
  const { data: billing } = await admin
    .from("workspace_billing")
    .select("plan, status")
    .eq("workspace_id", workspace.id)
    .maybeSingle<WorkspaceBillingRow>();

  const effectivePlan = getEffectiveBillingPlan(
    billing?.plan,
    billing?.status,
  );
  const availability = await getWorkspaceAiAvailability(effectivePlan);
  const config = getNvidiaConfig();

  if (!availability.enabled) {
    return {
      error: {
        code: availability.reason ?? "not-configured",
        message: availability.message,
      },
      userId: user.id,
      workspace,
    };
  }

  if (!config || !isNvidiaConfigReady(config)) {
    return {
      error: {
        code: "not-configured" as const,
        message: "AI is not configured yet.",
      },
      userId: user.id,
      workspace,
    };
  }

  return {
    config,
    effectivePlan,
    userId: user.id,
    workspace,
  };
}
