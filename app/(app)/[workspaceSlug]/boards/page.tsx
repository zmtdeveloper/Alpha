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
  const boardGroups = projects
    .map((project) => ({
      ...project,
      boards: boards.filter((board) => board.project_id === project.id),
    }))
    .filter((project) => project.boards.length > 0);

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
      ) : boardGroups.length > 0 ? (
        <section className="space-y-7">
          {boardGroups.map((project) => {
            const projectTaskTotal = project.boards.reduce(
              (total, board) => total + board.taskCount,
              0,
            );
            const projectColumnTotal = project.boards.reduce(
              (total, board) => total + board.columnCount,
              0,
            );

            return (
              <section className="space-y-3" key={project.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      className="inline-flex min-w-0 items-center gap-2 text-base font-semibold outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      href={`/${workspaceSlug}/projects/${project.slug}`}
                    >
                      <Layers3 className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                        <PanelsTopLeft className="size-3.5 text-primary" />
                        {project.boards.length} boards
                      </span>
                      <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                        <Clock3 className="size-3.5 text-amber-200" />
                        {projectTaskTotal} tasks
                      </span>
                      <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                        <Columns3 className="size-3.5 text-emerald-200" />
                        {projectColumnTotal} columns
                      </span>
                    </div>
                  </div>
                  <Link
                    className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/${workspaceSlug}/projects/${project.slug}`}
                  >
                    View project
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div className="overflow-hidden rounded-md border border-border bg-card/40 shadow-sm shadow-black/10">
                  <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_8.5rem] border-b border-border bg-muted/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground md:grid">
                    <span>Board</span>
                    <span>Tasks</span>
                    <span>Columns</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {project.boards.map((board) => (
                    <div
                      className="grid gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/35 md:grid-cols-[minmax(0,1fr)_7rem_7rem_8.5rem] md:items-center"
                      key={board.id}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="task-chip flex size-8 shrink-0 items-center justify-center rounded-md">
                          <PanelsTopLeft className="size-4 text-primary" />
                        </span>
                        <div className="min-w-0">
                          <Link
                            className="block truncate font-semibold outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                            href={`/${workspaceSlug}/boards/${board.slug}`}
                          >
                            {board.name}
                          </Link>
                          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                            {board.description || "Board workflow"}
                          </p>
                        </div>
                      </div>
                      <span className="task-chip inline-flex h-7 w-fit items-center gap-1 rounded-md px-2 text-xs text-muted-foreground">
                        <Clock3 className="size-3.5 text-amber-200" />
                        {board.taskCount}
                        <span className="md:hidden">tasks</span>
                      </span>
                      <span className="task-chip inline-flex h-7 w-fit items-center gap-1 rounded-md px-2 text-xs text-muted-foreground">
                        <Columns3 className="size-3.5 text-emerald-200" />
                        {board.columnCount}
                        <span className="md:hidden">columns</span>
                      </span>
                      <div className="flex items-center gap-1 md:justify-end">
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
                        <Button asChild className="size-8" size="icon" variant="ghost">
                          <Link
                            aria-label={`Open ${board.name}`}
                            href={`/${workspaceSlug}/boards/${board.slug}`}
                          >
                            <ArrowRight />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
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
