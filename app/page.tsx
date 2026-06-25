import Link from "next/link";

const columns = [
  {
    title: "Triage",
    count: "04",
    tasks: ["Invite onboarding", "Billing states", "Workspace roles"],
  },
  {
    title: "Building",
    count: "07",
    tasks: ["Board ordering", "Task detail panel", "Member settings"],
  },
  {
    title: "Ready",
    count: "03",
    tasks: ["RLS review", "Checkout redirect", "Welcome email"],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0d10] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8 2xl:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1680px] flex-col">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[#9be7c7]">
            Alpha
          </p>
          <Link
            href="/login"
            className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-[#9be7c7]/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#9be7c7] focus:ring-offset-2 focus:ring-offset-[#0b0d10]"
          >
            Sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 xl:grid-cols-[minmax(360px,0.74fr)_minmax(680px,1.26fr)] xl:py-12 2xl:grid-cols-[minmax(440px,0.7fr)_minmax(860px,1.3fr)]">
          <div className="max-w-2xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
              Workspace planning system
            </p>
            <h1 className="text-4xl font-semibold leading-[0.98] text-white sm:text-5xl lg:text-6xl 2xl:text-7xl">
              Project work, shaped for fast-moving teams.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Alpha is a focused project management app for shared workspaces,
              kanban boards, task ownership, team access, and subscription-backed
              collaboration.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#9be7c7] px-5 text-sm font-semibold text-[#07110d] transition hover:bg-[#b8f3da] focus:outline-none focus:ring-2 focus:ring-[#9be7c7] focus:ring-offset-2 focus:ring-offset-[#0b0d10]"
              >
                Create workspace
              </Link>
              <Link
                href="/alpha"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/35 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#9be7c7] focus:ring-offset-2 focus:ring-offset-[#0b0d10]"
              >
                Open workspace
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#11151a] p-3 shadow-2xl shadow-black/30 sm:p-4 2xl:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-medium text-white">Product Board</p>
                <p className="text-xs text-zinc-500">Workspace / Alpha</p>
              </div>
              <div className="rounded-md bg-[#17231f] px-3 py-1 font-mono text-xs text-[#9be7c7]">
                MVP
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 2xl:gap-4">
              {columns.map((column) => (
                <section
                  key={column.title}
                  className="min-h-72 rounded-md border border-white/10 bg-[#0d1014] p-3 2xl:min-h-96 2xl:p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-200">
                      {column.title}
                    </h2>
                    <span className="font-mono text-xs text-zinc-500">
                      {column.count}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {column.tasks.map((task) => (
                      <article
                        key={task}
                        className="rounded-md border border-white/10 bg-[#171c22] p-3"
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {task}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                          <span>Owner</span>
                          <span className="rounded bg-white/5 px-2 py-1 font-mono">
                            P1
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
