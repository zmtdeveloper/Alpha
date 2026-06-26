import Link from "next/link";

import {
  getCurrentUser,
  redirectToWorkspaceOrOnboarding,
} from "@/lib/auth/data";

const columns = [
  {
    title: "Todo",
    count: "04",
    tasks: ["Invite onboarding", "Subscription states", "Workspace roles"],
  },
  {
    title: "In Progress",
    count: "07",
    tasks: ["Drag ordering", "Task detail panel", "Member settings"],
  },
  {
    title: "In Review",
    count: "03",
    tasks: ["RLS review", "Checkout redirect", "Invite email"],
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    await redirectToWorkspaceOrOnboarding();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#1f1f22] text-zinc-100">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 grid grid-cols-[280px_1fr] opacity-80">
          <aside className="hidden border-r border-white/10 bg-[#252529] p-5 md:block">
            <div className="mb-10 flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-md border border-white/10 bg-[#202024] text-xs text-[#7f7af0]">
                A
              </span>
              <span className="text-sm font-medium">Alpha</span>
            </div>
            {["Search", "Inbox", "My issues", "Projects", "Boards"].map(
              (item, index) => (
                <div
                  className={
                    index === 4
                      ? "mb-2 rounded-md bg-white/8 px-3 py-2 text-sm text-white"
                      : "mb-2 px-3 py-2 text-sm text-zinc-500"
                  }
                  key={item}
                >
                  {item}
                </div>
              ),
            )}
          </aside>

          <section className="min-w-0 bg-[radial-gradient(circle_at_50%_0%,rgba(111,106,232,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-6 md:px-10">
              <div>
                <span className="text-sm text-zinc-500">Board</span>
                <span className="ml-2 text-xs text-zinc-600">19</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden h-8 rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-500 sm:inline-flex">
                  + Filter
                </span>
                <span className="flex size-9 items-center justify-center rounded-md bg-[#6f6ae8] text-xl text-white">
                  +
                </span>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-3 md:p-10">
              {columns.map((column) => (
                <div className="min-w-0" key={column.title}>
                  <div className="mb-3 flex h-9 items-center justify-between border-b border-white/10 text-sm">
                    <span>{column.title}</span>
                    <span className="text-zinc-500">{column.count}</span>
                  </div>
                  <div className="space-y-3">
                    {column.tasks.map((task, index) => (
                      <article
                        className="rounded-md border border-white/8 bg-[#2b2b30]/90 p-4 shadow-2xl shadow-black/10"
                        key={task}
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {task}
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
                          <span>...</span>
                          <span className="rounded border border-white/10 px-2 py-1">
                            P{index + 1}
                          </span>
                          <span className="rounded border border-white/10 px-2 py-1">
                            Alpha
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#1f1f22] via-[#1f1f22]/88 to-[#1f1f22]/20" />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-zinc-300">
            Alpha
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7f7af0] focus:ring-offset-2 focus:ring-offset-[#1f1f22]"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/35 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7f7af0] focus:ring-offset-2 focus:ring-offset-[#1f1f22]"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center px-5 pb-24 pt-10 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
              Project workspace
            </p>
            <h1 className="text-5xl font-semibold leading-[0.94] text-white sm:text-6xl lg:text-7xl">
              Alpha
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
              A focused workspace for projects, boards, tasks, and team access.
              Dense where work needs detail, quiet where teams need speed.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#6f6ae8] px-5 text-sm font-semibold text-white transition hover:bg-[#7f7af0] focus:outline-none focus:ring-2 focus:ring-[#7f7af0] focus:ring-offset-2 focus:ring-offset-[#1f1f22]"
              >
                Create workspace
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/35 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7f7af0] focus:ring-offset-2 focus:ring-offset-[#1f1f22]"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
