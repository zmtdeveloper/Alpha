import {
  CalendarDays,
  CircleDot,
  Clock3,
  Columns3,
  PanelsTopLeft,
  Rocket,
  Users,
} from "lucide-react";
import Link from "next/link";

import { getWorkspaceOverviewData } from "@/lib/workspace/data";
import { cn } from "@/lib/utils";

const priorityLabels = {
  high: "High",
  low: "Low",
  medium: "Medium",
  none: "None",
  urgent: "Urgent",
};

const priorityTone = {
  high: "text-amber-200",
  low: "text-emerald-200",
  medium: "text-sky-200",
  none: "text-muted-foreground",
  urgent: "text-red-200",
};

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const data = await getWorkspaceOverviewData(workspaceSlug);
  const projectBoardCoverage = percentage(data.boardCount, data.projectCount);
  const columnWorkCoverage = percentage(
    data.activeColumnCount,
    data.boardCount * 4,
  );
  const dueSoonLoad = percentage(data.dueSoonCount, data.openTaskCount);
  const stats = [
    {
      detail: `${data.inProgressCount} in progress`,
      icon: Clock3,
      label: "Open",
      tone: "text-amber-200",
      value: data.openTaskCount,
    },
    {
      detail: `${data.boardCount} boards`,
      icon: Rocket,
      label: "Projects",
      tone: "text-primary",
      value: data.projectCount,
    },
    {
      detail: "Next 7 days",
      icon: CalendarDays,
      label: "Due soon",
      tone: "text-red-200",
      value: data.dueSoonCount,
    },
    {
      detail: `${data.activeColumnCount} active columns`,
      icon: Users,
      label: "Members",
      tone: "text-emerald-200",
      value: data.memberCount,
    },
  ];

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Workspace overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {data.workspace.name}
          </h1>
        </div>
        <div className="task-chip inline-flex h-7 w-fit items-center gap-2 rounded-md px-2 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          Live workspace data
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card/60 shadow-sm shadow-black/10">
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                className="flex min-h-16 items-center justify-between gap-3 px-3 py-2.5"
                key={stat.label}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="task-chip flex size-8 shrink-0 items-center justify-center rounded-md">
                    <Icon className={cn("size-3.5", stat.tone)} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {stat.label}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {stat.detail}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-semibold tabular-nums text-foreground">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-md border border-border bg-card/60 shadow-sm shadow-black/10">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Needs attention</h2>
              <p className="text-xs text-muted-foreground">
                Priority-ranked tasks across this workspace.
              </p>
            </div>
            <span className="task-chip inline-flex h-7 shrink-0 items-center rounded-md px-2 text-xs text-muted-foreground">
              {data.focusTasks.length} shown
            </span>
          </div>

          {data.focusTasks.length > 0 ? (
            <>
              <div className="hidden grid-cols-[minmax(0,1fr)_9rem_7rem_7rem] border-b border-border bg-muted/25 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground md:grid">
                <span>Task</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Due</span>
              </div>
              <div className="divide-y divide-border">
                {data.focusTasks.map((task) => (
                  <Link
                    className="grid gap-2 px-3 py-2.5 outline-none transition-colors hover:bg-accent/45 focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(0,1fr)_9rem_7rem_7rem] md:items-center"
                    href={`/${workspaceSlug}/boards/${task.boardSlug}`}
                    key={task.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-5 text-foreground">
                        {task.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {task.projectName} / {task.boardName}
                      </p>
                    </div>
                    <span className="task-chip inline-flex h-7 w-fit max-w-full items-center rounded-md px-2 text-xs text-muted-foreground md:w-auto">
                      <span className="truncate">{task.columnName}</span>
                    </span>
                    <span
                      className={cn(
                        "task-chip inline-flex h-7 w-fit items-center gap-1 rounded-md px-2 text-xs",
                        priorityTone[task.priority],
                      )}
                    >
                      <CircleDot className="size-3" />
                      {priorityLabels[task.priority]}
                    </span>
                    <span className="inline-flex h-7 items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      {formatDueDate(task.due_date)}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center px-4 py-8 text-center">
              <PanelsTopLeft className="size-8 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-semibold">No active tasks</h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                Create tasks inside a board to see priority work here.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-md border border-border bg-card/60 p-3 shadow-sm shadow-black/10">
            <div className="mb-3 flex items-center gap-2">
              <PanelsTopLeft className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Workspace pulse</h2>
            </div>
            <div className="space-y-3">
              <HealthBar label="Projects with boards" value={projectBoardCoverage} />
              <HealthBar label="Columns with work" value={columnWorkCoverage} />
              <HealthBar label="Due soon load" value={dueSoonLoad} />
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-card/60 shadow-sm shadow-black/10">
            <SignalRow
              detail={`${data.projectCount} projects`}
              icon={PanelsTopLeft}
              label="Boards"
              value={data.boardCount}
            />
            <SignalRow
              detail={`${data.boardCount} boards`}
              icon={Columns3}
              label="Active columns"
              value={data.activeColumnCount}
            />
            <SignalRow
              detail={`${data.openTaskCount} open`}
              icon={Clock3}
              label="In progress"
              value={data.inProgressCount}
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
      <div className="mb-1 flex justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate">{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SignalRow({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="task-chip flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{label}</p>
          <p className="truncate text-[11px] text-muted-foreground">{detail}</p>
        </div>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function percentage(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((part / total) * 100));
}

function formatDueDate(date: string | null) {
  if (!date) {
    return "Open";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}
