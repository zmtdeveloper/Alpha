import { AppShell } from "@/components/app-shell";
import { getWorkspaceAiAvailability } from "@/lib/ai/access";
import { getWorkspaceBillingData } from "@/lib/billing/data";
import { getWorkspaceShellContext } from "@/lib/auth/data";
import { getWorkspaceOverviewData } from "@/lib/workspace/data";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const [context, overviewData, billingData] = await Promise.all([
    getWorkspaceShellContext(workspaceSlug),
    getWorkspaceOverviewData(workspaceSlug),
    getWorkspaceBillingData(workspaceSlug),
  ]);
  const workspaceAiAvailability = await getWorkspaceAiAvailability(
    billingData.effectivePlan,
  );
  const workspaceAiSummary = {
    activeColumnCount: overviewData.activeColumnCount,
    dueSoonCount: overviewData.dueSoonCount,
    focusTasks: overviewData.focusTasks,
    inProgressCount: overviewData.inProgressCount,
    memberCount: overviewData.memberCount,
    openTaskCount: overviewData.openTaskCount,
    projectCount: overviewData.projectCount,
    userName: context.user.fullName,
    workspaceName: overviewData.workspace.name,
    workspaceSlug: overviewData.workspace.slug,
  };

  return (
    <AppShell
      workspaceAiAvailability={workspaceAiAvailability}
      workspaceAiSummary={workspaceAiSummary}
      user={context.user}
      workspace={context.workspace}
      workspaces={context.workspaces}
    >
      {children}
    </AppShell>
  );
}
