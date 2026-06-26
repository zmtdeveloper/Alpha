import "server-only";

import type { Enums } from "@/lib/database.types";
import { sendTransactionalEmail } from "@/lib/email/resend";
import {
  renderBillingUpgradeEmail,
  renderInvitationEmail,
  renderWelcomeEmail,
} from "@/lib/email/templates";

type WelcomeEmailInput = {
  email: string;
  fullName: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceUrl: string;
};

type InvitationEmailInput = {
  email: string;
  expiresAt: string;
  invitationId: number;
  inviteUrl: string;
  inviterName: string;
  role: Enums<"app_role">;
  workspaceName: string;
  workspaceSlug: string;
};

type BillingUpgradeEmailInput = {
  email: string;
  planName: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceUrl: string;
};

export async function sendWelcomeEmail({
  email,
  fullName,
  workspaceName,
  workspaceSlug,
  workspaceUrl,
}: WelcomeEmailInput) {
  const emailContent = renderWelcomeEmail({
    fullName,
    workspaceName,
    workspaceUrl,
  });

  return sendTransactionalEmail({
    ...emailContent,
    kind: "welcome",
    logContext: {
      workspaceSlug,
    },
    to: email,
  });
}

export async function sendInvitationEmail({
  email,
  expiresAt,
  invitationId,
  inviteUrl,
  inviterName,
  role,
  workspaceName,
  workspaceSlug,
}: InvitationEmailInput) {
  const emailContent = renderInvitationEmail({
    expiresAt,
    inviteUrl,
    inviterName,
    role,
    workspaceName,
  });

  return sendTransactionalEmail({
    ...emailContent,
    kind: "invitation",
    logContext: {
      invitationId,
      role,
      workspaceSlug,
    },
    to: email,
  });
}

export async function sendBillingUpgradeEmail({
  email,
  planName,
  workspaceName,
  workspaceSlug,
  workspaceUrl,
}: BillingUpgradeEmailInput) {
  const emailContent = renderBillingUpgradeEmail({
    planName,
    workspaceName,
    workspaceUrl,
  });

  return sendTransactionalEmail({
    ...emailContent,
    kind: "billing-upgrade",
    logContext: {
      planName,
      workspaceSlug,
    },
    to: email,
  });
}
