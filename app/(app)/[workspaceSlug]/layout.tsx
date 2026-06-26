import { AppShell } from "@/components/app-shell";
import { getWorkspaceShellContext } from "@/lib/auth/data";
import { getWorkspaceQuickTaskTarget } from "@/lib/workspace/data";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const [context, quickTaskBoardSlug] = await Promise.all([
    getWorkspaceShellContext(workspaceSlug),
    getWorkspaceQuickTaskTarget(workspaceSlug),
  ]);

  return (
    <AppShell
      quickTaskBoardSlug={quickTaskBoardSlug}
      user={context.user}
      workspace={context.workspace}
      workspaces={context.workspaces}
    >
      {children}
    </AppShell>
  );
}
