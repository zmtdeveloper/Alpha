import { CalendarDays, PanelsTopLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { BoardDialog, ProjectDialog } from "@/components/workspace/forms";
import { getBoardsPageData, getProjectDetailData } from "@/lib/workspace/data";

const statusLabels = {
  active: "Active",
  canceled: "Canceled",
  completed: "Completed",
  paused: "Paused",
  planned: "Planned",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectSlug: string; workspaceSlug: string }>;
}) {
  const { projectSlug, workspaceSlug } = await params;
  const [project, { projects }] = await Promise.all([
    getProjectDetailData(workspaceSlug, projectSlug),
    getBoardsPageData(workspaceSlug),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Project
          </p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {project.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-accent px-2 py-1 text-accent-foreground">
              {statusLabels[project.status]}
            </span>
            <span>Lead {project.lead?.fullName ?? "None"}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {project.target_date ?? "No target"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <ProjectDialog
            members={project.members}
            project={project}
            trigger={
              <Button variant="outline">
                <Pencil />
                Edit
              </Button>
            }
            workspaceSlug={workspaceSlug}
          />
          <BoardDialog
            projects={projects}
            trigger={
              <Button>
                <Plus />
                New board
              </Button>
            }
            workspaceSlug={workspaceSlug}
          />
        </div>
      </section>

      {project.description ? (
        <section className="rounded-lg border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
          {project.description}
        </section>
      ) : null}

      {project.boards.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {project.boards.map((board) => (
            <Link
              className="rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring"
              href={`/${workspaceSlug}/boards/${board.slug}`}
              key={board.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{board.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {board.description || "Board workflow"}
                  </p>
                </div>
                <PanelsTopLeft className="size-4 text-primary" />
              </div>
              <div className="mt-5 flex gap-5 text-sm text-muted-foreground">
                <span>{board.taskCount} tasks</span>
                <span>{board.columnCount} columns</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState
          description="Create a board to turn this project into task columns and execution flow."
          icon={PanelsTopLeft}
          title="No boards in this project"
        />
      )}
    </div>
  );
}
