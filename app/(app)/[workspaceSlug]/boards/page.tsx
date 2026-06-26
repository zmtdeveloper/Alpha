import {
  ArrowRight,
  Clock3,
  Columns3,
  Layers3,
  Pencil,
  Plus,
  PanelsTopLeft,
} from "lucide-react";
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
  const columnTotal = boards.reduce(
    (total, board) => total + board.columnCount,
    0,
  );
  const taskTotal = boards.reduce((total, board) => total + board.taskCount, 0);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Boards
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Workspace boards
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
              <PanelsTopLeft className="size-3.5 text-primary" />
              {boards.length} boards
            </span>
            <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
              <Columns3 className="size-3.5 text-sky-200" />
              {columnTotal} columns
            </span>
            <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
              <Clock3 className="size-3.5 text-amber-200" />
              {taskTotal} tasks
            </span>
          </div>
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
              className="task-card group rounded-md border border-border p-4 shadow-sm shadow-black/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="task-chip flex size-9 shrink-0 items-center justify-center rounded-md">
                    <PanelsTopLeft className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <Link
                      className="block truncate text-base font-semibold outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      href={`/${workspaceSlug}/boards/${board.slug}`}
                    >
                      {board.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {board.description || `${board.projectName} workflow`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <BoardDialog
                    board={board}
                    projects={projects}
                    trigger={
                      <Button
                        aria-label="Edit board"
                        className="size-8"
                        size="icon"
                        variant="ghost"
                      >
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
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                  <Layers3 className="size-3.5 text-sky-200" />
                  {board.projectName}
                </span>
                <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                  <Clock3 className="size-3.5 text-amber-200" />
                  {board.taskCount} tasks
                </span>
                <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                  <Columns3 className="size-3.5 text-emerald-200" />
                  {board.columnCount} columns
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-3 text-sm">
                <span className="text-muted-foreground">
                  Board execution flow
                </span>
                <Link
                  className="inline-flex items-center gap-1 font-medium text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/${workspaceSlug}/boards/${board.slug}`}
                >
                  Open board
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
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
