import { Pencil, Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/workspace/delete-button";
import { BoardDialog } from "@/components/workspace/forms";
import { getBoardsPageData } from "@/lib/workspace/data";

export default async function BoardsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { boards, projects } = await getBoardsPageData(workspaceSlug);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Boards
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Workspace boards
          </h1>
        </div>
        <BoardDialog
          projects={projects}
          trigger={
            <Button disabled={projects.length === 0}>
              <Plus />
              New board
            </Button>
          }
          workspaceSlug={workspaceSlug}
        />
      </section>

      {projects.length === 0 ? (
        <EmptyState
          action="New project"
          actionHref={`/${workspaceSlug}/projects`}
          description="Boards belong to projects. Create a project first, then add a board for that workstream."
          icon={Plus}
          title="Create a project first"
        />
      ) : boards.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {boards.map((board) => (
            <article
              key={board.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    className="font-semibold outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/${workspaceSlug}/boards/${board.slug}`}
                  >
                    {board.name}
                  </Link>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {board.description || board.projectName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <BoardDialog
                    board={board}
                    projects={projects}
                    trigger={
                      <Button aria-label="Edit board" size="icon" variant="ghost">
                        <Pencil />
                      </Button>
                    }
                    workspaceSlug={workspaceSlug}
                  />
                  <DeleteButton
                    id={board.id}
                    kind="board"
                    label="Delete board"
                    workspaceSlug={workspaceSlug}
                  />
                </div>
              </div>
              <div className="mt-5 flex gap-5 text-sm text-muted-foreground">
                <span>{board.taskCount} tasks</span>
                <span>{board.columnCount} columns</span>
                <span>{board.projectName}</span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          action="New board"
          description="Create a board to organize columns, tasks, labels, and assignees for this workspace."
          icon={Plus}
          title="No boards yet"
        />
      )}
    </div>
  );
}
