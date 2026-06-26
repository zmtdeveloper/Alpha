import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  Columns3,
  PanelsTopLeft,
  PauseCircle,
  Pencil,
  Plus,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { BoardDialog, ProjectDialog } from "@/components/workspace/forms";
import { getBoardsPageData, getProjectDetailData } from "@/lib/workspace/data";
import { cn } from "@/lib/utils";

const statusLabels = {
  active: "Active",
  canceled: "Canceled",
  completed: "Completed",
  paused: "Paused",
  planned: "Planned",
};

const statusTone = {
  active: {
    dot: "bg-emerald-400",
    icon: CircleDot,
    text: "text-emerald-200",
  },
  canceled: {
    dot: "bg-red-400",
    icon: XCircle,
    text: "text-red-200",
  },
  completed: {
    dot: "bg-primary",
    icon: CheckCircle2,
    text: "text-violet-100",
  },
  paused: {
    dot: "bg-amber-300",
    icon: PauseCircle,
    text: "text-amber-100",
  },
  planned: {
    dot: "bg-sky-300",
    icon: Circle,
    text: "text-sky-100",
  },
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
  const tone = statusTone[project.status];
  const StatusIcon = tone.icon;
  const taskTotal = project.boards.reduce(
    (total, board) => total + board.taskCount,
    0,
  );
  const columnTotal = project.boards.reduce(
    (total, board) => total + board.columnCount,
    0,
  );

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-md border border-border bg-card/45 p-5 shadow-sm shadow-black/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-3">
              <span className="task-chip flex size-10 shrink-0 items-center justify-center rounded-md">
                <StatusIcon className={cn("size-4", tone.text)} />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Project
                </p>
                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  {project.name}
                </h1>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "task-chip inline-flex h-7 items-center gap-1 rounded-md px-2",
                  tone.text,
                )}
              >
                <span className={cn("size-1.5 rounded-full", tone.dot)} />
                {statusLabels[project.status]}
              </span>
              <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                {project.lead ? (
                  <span className="flex size-5 items-center justify-center rounded-full border border-card bg-secondary text-[10px] font-semibold text-secondary-foreground">
                    {project.lead.initials}
                  </span>
                ) : (
                  <UserRound className="size-3.5" />
                )}
                Lead {project.lead?.fullName ?? "None"}
              </span>
              <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                <CalendarDays className="size-3" />
                {project.target_date ?? "No target"}
              </span>
              <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                <PanelsTopLeft className="size-3.5 text-primary" />
                {project.boards.length} boards
              </span>
              <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                <Clock3 className="size-3.5 text-amber-200" />
                {taskTotal} tasks
              </span>
              <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
                <Columns3 className="size-3.5 text-emerald-200" />
                {columnTotal} columns
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
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
        </div>
      </section>

      {project.description ? (
        <section className="task-card rounded-md border border-border p-4 text-sm leading-6 text-muted-foreground shadow-sm shadow-black/10">
          {project.description}
        </section>
      ) : null}

      {project.boards.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {project.boards.map((board) => (
            <article
              className="task-card group rounded-md border border-border p-4 shadow-sm shadow-black/10 transition-colors"
              key={board.id}
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
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {board.description || "Board workflow"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                <span className="text-muted-foreground">Board workflow</span>
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
          description="Create a board to turn this project into task columns and execution flow."
          icon={PanelsTopLeft}
          title="No boards in this project"
        />
      )}
    </div>
  );
}
