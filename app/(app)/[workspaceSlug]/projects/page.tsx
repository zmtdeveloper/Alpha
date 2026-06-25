import { CalendarDays, Pencil, Plus, Rocket } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/workspace/delete-button";
import { ProjectDialog } from "@/components/workspace/forms";
import { Button } from "@/components/ui/button";
import { getProjectsPageData } from "@/lib/workspace/data";

const statusLabels = {
  active: "Active",
  canceled: "Canceled",
  completed: "Completed",
  paused: "Paused",
  planned: "Planned",
};

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { members, projects } = await getProjectsPageData(workspaceSlug);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Projects
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Workspace projects
          </h1>
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
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    className="truncate font-semibold outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/${workspaceSlug}/projects/${project.slug}`}
                  >
                    {project.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-accent px-2 py-1 text-accent-foreground">
                      {statusLabels[project.status]}
                    </span>
                    <span>Lead {project.lead?.initials ?? "None"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ProjectDialog
                    members={members}
                    project={project}
                    trigger={
                      <Button aria-label="Edit project" size="icon" variant="ghost">
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

              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Boards</p>
                  <p className="mt-1 font-semibold">{project.boardCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasks</p>
                  <p className="mt-1 font-semibold">{project.taskCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p className="mt-1 flex items-center gap-1 font-semibold">
                    <CalendarDays className="size-3" />
                    {project.target_date ?? "Open"}
                  </p>
                </div>
              </div>
            </article>
          ))}
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
