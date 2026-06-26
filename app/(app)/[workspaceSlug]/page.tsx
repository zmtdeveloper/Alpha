import {
  ArrowUpRight,
  CalendarDays,
  CircleDot,
  PanelsTopLeft,
  Users,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { getWorkspaceOverviewData } from "@/lib/workspace/data";

const priorityLabels = {
  high: "High",
  low: "Low",
  medium: "Medium",
  none: "None",
  urgent: "Urgent",
};

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const data = await getWorkspaceOverviewData(workspaceSlug);
  const stats = [
    {
      detail: `${data.inProgressCount} in progress`,
      label: "Open tasks",
      value: data.openTaskCount,
    },
    {
      detail: `${data.boardCount} boards`,
      label: "Projects",
      value: data.projectCount,
    },
    {
      detail: "Next 7 days",
      label: "Due soon",
      value: data.dueSoonCount,
    },
    {
      detail: `${data.activeColumnCount} active columns`,
      label: "Members",
      value: data.memberCount,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Workspace overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {data.workspace.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          Live workspace data
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-md border border-border bg-card/70 p-4 text-card-foreground shadow-sm shadow-black/10"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="rounded-md border border-border bg-card/70">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Focus queue</h2>
              <p className="text-xs text-muted-foreground">
                Highest priority tasks across this workspace.
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </div>

          {data.focusTasks.length > 0 ? (
            <div className="divide-y divide-border">
              {data.focusTasks.map((task) => (
                <Link
                  className="grid gap-3 px-4 py-3 outline-none transition-colors hover:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_150px_110px_92px] sm:items-center"
                  href={`/${workspaceSlug}/boards/${task.boardSlug}`}
                  key={task.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.projectName} / {task.boardName}
                    </p>
                  </div>
                  <span className="truncate text-sm text-muted-foreground">
                    {task.columnName}
                  </span>
                  <span className="inline-flex w-fit items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                    <CircleDot className="size-3" />
                    {priorityLabels[task.priority]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    {task.due_date ?? "Open"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              className="min-h-72 rounded-none border-0 bg-transparent"
              description="Create projects, boards, and tasks to populate this view with live workspace work."
              icon={PanelsTopLeft}
              title="No tasks yet"
            />
          )}
        </div>

        <aside className="rounded-md border border-border bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <PanelsTopLeft className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Board coverage</h2>
          </div>
          <div className="mt-4 space-y-3">
            <HealthBar
              label="Projects with boards"
              value={
                data.projectCount === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.round((data.boardCount / data.projectCount) * 100),
                    )
              }
            />
            <HealthBar
              label="Columns with work"
              value={
                data.boardCount === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.round(
                        (data.activeColumnCount /
                          Math.max(data.boardCount * 4, 1)) *
                          100,
                      ),
                    )
              }
            />
            <HealthBar
              label="Due soon load"
              value={
                data.openTaskCount === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.round((data.dueSoonCount / data.openTaskCount) * 100),
                    )
              }
            />
          </div>
        </aside>
      </section>
    </div>
  );
}

function HealthBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
