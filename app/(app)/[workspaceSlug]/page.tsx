import { ArrowUpRight, CalendarDays, CircleDot, Clock3 } from "lucide-react";

const stats = [
  { label: "Open tasks", value: "42", delta: "+8 this week" },
  { label: "In progress", value: "12", delta: "Across 3 boards" },
  { label: "Due soon", value: "06", delta: "Next 7 days" },
  { label: "Members", value: "09", delta: "3 admins" },
];

const focusItems = [
  {
    title: "Stabilize workspace creation",
    board: "Platform",
    owner: "ZM",
    status: "Building",
  },
  {
    title: "Define board list empty state",
    board: "Product",
    owner: "AR",
    status: "Review",
  },
  {
    title: "Prepare RLS policy checklist",
    board: "Security",
    owner: "NS",
    status: "Triage",
  },
];

export default function WorkspaceHome() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Workspace overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Today&apos;s operating view
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="size-4" />
          Updated just now
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4 text-card-foreground"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.delta}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Focus queue</h2>
              <p className="text-xs text-muted-foreground">
                High-signal work across active boards.
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {focusItems.map((item) => (
              <article
                key={item.title}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px_72px_92px] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.board}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.status}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.owner}
                </span>
                <span className="inline-flex w-fit items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                  <CircleDot className="size-3" />
                  P1
                </span>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Cycle health</h2>
          </div>
          <div className="mt-4 space-y-3">
            {["Scope", "Velocity", "Review load"].map((label, index) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span>{[72, 58, 36][index]}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${[72, 58, 36][index]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
