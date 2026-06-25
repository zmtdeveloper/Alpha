import { AppShell } from "@/components/app-shell";
import { getWorkspaceShellContext } from "@/lib/auth/data";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const context = await getWorkspaceShellContext(workspaceSlug);

  return (
    <AppShell
      user={context.user}
      workspace={context.workspace}
      workspaces={context.workspaces}
    >
      {children}
    </AppShell>
  );
}
