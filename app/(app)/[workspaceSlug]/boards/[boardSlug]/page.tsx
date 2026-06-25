import { KanbanBoard } from "@/components/workspace/kanban-board";
import { getBoardDetailData } from "@/lib/workspace/data";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardSlug: string; workspaceSlug: string }>;
}) {
  const { boardSlug, workspaceSlug } = await params;
  const board = await getBoardDetailData(workspaceSlug, boardSlug);

  return <KanbanBoard board={board} workspaceSlug={workspaceSlug} />;
}
