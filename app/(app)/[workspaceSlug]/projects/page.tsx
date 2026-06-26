import {
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  Layers3,
  PauseCircle,
  Pencil,
  Plus,
  Rocket,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/workspace/delete-button";
import { ProjectDialog } from "@/components/workspace/forms";
import { Button } from "@/components/ui/button";
import { getProjectsPageData } from "@/lib/workspace/data";
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

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { members, projects } = await getProjectsPageData(workspaceSlug);
  const boardTotal = projects.reduce(
    (total, project) => total + project.boardCount,
    0,
  );
  const taskTotal = projects.reduce(
    (total, project) => total + project.taskCount,
    0,
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Projects
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Workspace projects
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
              <Rocket className="size-3.5 text-primary" />
              {projects.length} projects
            </span>
            <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
              <Layers3 className="size-3.5 text-sky-200" />
              {boardTotal} boards
            </span>
            <span className="task-chip inline-flex h-7 items-center gap-1 rounded-md px-2">
              <Clock3 className="size-3.5 text-amber-200" />
              {taskTotal} tasks
            </span>
          </div>
        </div>
        <ProjectDialog
          members={members}
          trigger={
            <Button>
              <Plus />
              New project
            </Button>
          }
          workspaceSlug={workspaceSlug}
        />
      </section>

      {projects.length > 0 ? (
        <section className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {projects.map((project) => {
            const tone = statusTone[project.status];
            const StatusIcon = tone.icon;

            return (
              <article
                key={project.id}
                className="task-card group rounded-md border border-border p-4 shadow-sm shadow-black/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="task-chip flex size-9 shrink-0 items-center justify-center rounded-md">
                      <StatusIcon className={cn("size-4", tone.text)} />
                    </span>
                    <div className="min-w-0">
                      <Link
                        className="block truncate text-base font-semibold outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                        href={`/${workspaceSlug}/projects/${project.slug}`}
                      >
                        {project.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {project.description ||
                          `${project.boardCount} boards and ${project.taskCount} tasks in this workstream.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ProjectDialog
                      members={members}
                      project={project}
                      trigger={
                        <Button
                          aria-label="Edit project"
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
                      id={project.id}
                      kind="project"
                      label="Delete project"
                      workspaceSlug={workspaceSlug}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div className="task-chip rounded-md px-3 py-2">
                    <p className="text-xs text-muted-foreground">Boards</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {project.boardCount}
                    </p>
                  </div>
                  <div className="task-chip rounded-md px-3 py-2">
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {project.taskCount}
                    </p>
                  </div>
                  <div className="task-chip rounded-md px-3 py-2">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="mt-1 flex items-center gap-1 truncate font-semibold text-foreground">
                      <CalendarDays className="size-3 shrink-0" />
                      {project.target_date ?? "Open"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          action="New project"
          description="Create a project to group boards, tasks, owners, and target dates inside this workspace."
          icon={Rocket}
          title="No projects yet"
        />
      )}
    </div>
  );
}
