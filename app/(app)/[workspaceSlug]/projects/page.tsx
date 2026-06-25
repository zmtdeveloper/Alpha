import { CalendarDays, Plus, Rocket } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

const projects = [
  {
    name: "Launch Alpha",
    status: "Active",
    lead: "ZM",
    target: "Aug 30",
    boards: 2,
    tasks: 42,
  },
  {
    name: "Team Access",
    status: "Planned",
    lead: "AR",
    target: "Sep 12",
    boards: 1,
    tasks: 18,
  },
];

export default function ProjectsPage() {
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
        <Button>
          <Plus />
          New project
        </Button>
      </section>

      {projects.length > 0 ? (
        <section className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.name}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{project.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-accent px-2 py-1 text-accent-foreground">
                      {project.status}
                    </span>
                    <span>Lead {project.lead}</span>
                  </div>
                </div>
                <Rocket className="size-4 text-primary" />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Boards</p>
                  <p className="mt-1 font-semibold">{project.boards}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasks</p>
                  <p className="mt-1 font-semibold">{project.tasks}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p className="mt-1 flex items-center gap-1 font-semibold">
                    <CalendarDays className="size-3" />
                    {project.target}
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
