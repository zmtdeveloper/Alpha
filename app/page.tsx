import {
  ArrowRight,
  Bot,
  CircleDot,
  Plus,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { PricingCards } from "@/components/billing/pricing-cards";
import { SiteFooter } from "@/components/site-footer";
import {
  getCurrentUser,
  redirectToWorkspaceOrOnboarding,
} from "@/lib/auth/data";
import { cn } from "@/lib/utils";

const boardColumns = [
  {
    title: "Backlog",
    count: 3,
    dot: "bg-muted-foreground",
    tasks: [
      ["API contract for customer portal", "infra"],
      ["Invite acceptance review", "auth"],
      ["Workspace limits copy", "billing"],
    ],
  },
  {
    title: "Todo",
    count: 4,
    dot: "bg-sky-400",
    tasks: [
      ["Design dashboard polish", "design"],
      ["Task detail keyboard flow", "feature"],
      ["Pricing page audit", "billing"],
    ],
  },
  {
    title: "In progress",
    count: 2,
    dot: "bg-amber-400",
    tasks: [
      ["Kanban drag-and-drop", "feature"],
      ["AI drawer markdown", "ai"],
      ["Member settings roles", "team"],
    ],
  },
  {
    title: "In review",
    count: 2,
    dot: "bg-primary",
    tasks: [
      ["User profile page", "ui"],
      ["RLS smoke checks", "security"],
      ["Welcome email template", "email"],
    ],
  },
];

const capabilityHighlights = [
  {
    detail: "Projects, boards, tasks",
    icon: Rocket,
    title: "Plan",
  },
  {
    detail: "Kanban lanes and priority",
    icon: CircleDot,
    title: "Move",
  },
  {
    detail: "Roles, invites, members",
    icon: Users,
    title: "Team",
  },
  {
    detail: "Workspace-level chat",
    icon: Sparkles,
    title: "Ask AI",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    await redirectToWorkspaceOrOnboarding();
  }

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />
        <div className="absolute inset-x-0 top-16 h-px bg-border" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgb(111_106_232_/_0.18),transparent_30%),linear-gradient(180deg,rgb(255_255_255_/_0.035),transparent_42%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background to-transparent" />

        <header className="relative z-10 flex h-16 items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href="/"
          >
            <BrandLogo />
          </Link>
          <Link
            className="absolute left-1/2 hidden -translate-x-1/2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
            href="#pricing"
          >
            Pricing
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="/signup"
            >
              Get started
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col items-center px-5 pt-20 text-center sm:px-8 sm:pt-24 lg:px-10">
          <div className="mt-8 inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card/75 px-3 text-sm text-muted-foreground shadow-sm shadow-black/20 sm:mt-10">
            <Bot className="size-3.5 text-primary" />
            Kanban-first project management
          </div>

          <h1 className="mt-8 w-full max-w-4xl text-4xl font-semibold leading-[0.96] text-foreground sm:text-6xl lg:text-7xl">
            Ship faster.
            <span className="block bg-gradient-to-r from-foreground via-[#b9c7ff] to-primary bg-clip-text text-transparent">
              Stay aligned.
            </span>
          </h1>
          <p className="mt-6 w-full max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            A kanban-first project workspace for teams that need boards, tasks,
            members, billing, and AI help in one focused app.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md bg-foreground px-6 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="/signup"
            >
              Get started free
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card/45 px-6 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="#pricing"
            >
              View pricing
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 min-w-0 w-full max-w-6xl sm:mt-16">
            <ProductWindow />
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 pt-6 sm:px-8 sm:pb-28 lg:px-10">
        <div className="mx-auto grid w-full max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capabilityHighlights.map((capability) => {
            const Icon = capability.icon;

            return (
              <article
                className="task-card flex items-center gap-3 rounded-md border border-border/70 bg-card/70 p-3 shadow-sm shadow-black/10"
                key={capability.title}
              >
                <span className="task-chip flex size-9 shrink-0 items-center justify-center rounded-md text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold">{capability.title}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {capability.detail}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="relative px-5 pb-20 pt-8 sm:px-8 sm:pb-28 lg:px-10"
        id="pricing"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgb(111_106_232_/_0.18),transparent_38%)]" />
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative z-10 mx-auto mb-10 max-w-3xl text-center">
            <div className="mx-auto inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card/75 px-3 text-sm text-muted-foreground shadow-sm shadow-black/20">
              <CircleDot className="size-3.5 text-primary" />
              Pricing
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Start simple.
              <span className="block bg-gradient-to-r from-foreground via-[#b9c7ff] to-primary bg-clip-text text-transparent">
                Scale when it matters.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Choose Free, Lite, or Pro based on workspace size. Existing work
              stays safe when limits change.
            </p>
          </div>

          <div className="relative z-10">
            <PricingCards
              mode="public"
              publicCtaHref="/signup"
              publicCtaLabel="Create workspace"
            />
          </div>
        </div>
      </section>

      <section className="relative px-5 pb-24 pt-4 sm:px-8 sm:pb-28 lg:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_30%,rgb(111_106_232_/_0.22),transparent_42%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
            Create a workspace, invite the team, and start moving work.
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-foreground px-6 text-sm font-semibold text-background shadow-[0_0_34px_rgb(255_255_255_/_0.16)] transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="/signup"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-card/45 px-6 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="#pricing"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function ProductWindow() {
  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-md border border-border bg-card shadow-2xl shadow-black/40">
      <div className="flex h-7 min-w-0 items-center justify-between border-b border-border bg-card/90 px-2 sm:h-11 sm:px-4">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <span className="size-1.5 rounded-full bg-red-400 sm:size-3" />
          <span className="size-1.5 rounded-full bg-amber-400 sm:size-3" />
          <span className="size-1.5 rounded-full bg-emerald-400 sm:size-3" />
          <span className="ml-1 flex h-4 min-w-0 max-w-32 items-center overflow-hidden rounded-sm bg-background/65 px-2 font-mono text-[7px] text-muted-foreground sm:ml-6 sm:h-6 sm:w-72 sm:max-w-none sm:px-4 sm:text-xs">
            localhost:3000/alpha/boards/roadmap
          </span>
        </div>
      </div>

      <div className="grid min-h-[13rem] min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] bg-background/45 sm:min-h-[30rem] sm:grid-cols-[12.5rem_minmax(0,1fr)]">
        <aside className="min-w-0 border-r border-border bg-[var(--sidebar)] p-1.5 text-left sm:p-3">
          <div className="mb-2 flex items-center gap-1 sm:mb-5 sm:gap-2">
            <BrandLogo
              markClassName="size-5 rounded-sm text-[9px] sm:size-7 sm:rounded-md sm:text-xs"
              textClassName="text-[8px] sm:text-sm"
            />
          </div>
          <p className="px-1 pb-1 font-mono text-[5px] uppercase text-muted-foreground sm:px-2 sm:pb-2 sm:text-[10px]">
            Projects
          </p>
          {["Design System", "Mobile App", "API Service"].map((item, index) => (
            <div
              className={cn(
                "mb-0.5 flex items-center gap-1 rounded-sm px-1 py-1 text-[6px] sm:mb-1 sm:gap-2 sm:rounded-md sm:px-2 sm:py-2 sm:text-xs",
                index === 0
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
              key={item}
            >
              <span
                className={cn(
                  "size-1 rounded-full sm:size-2",
                  index === 0 && "bg-primary",
                  index === 1 && "bg-emerald-400",
                  index === 2 && "bg-amber-400",
                )}
              />
              {item}
            </div>
          ))}
          <div className="mt-3 border-t border-border pt-1.5 text-[6px] text-muted-foreground sm:mt-6 sm:pt-3 sm:text-xs">
            <p className="rounded-sm px-1 py-1 sm:rounded-md sm:px-2 sm:py-2">
              Team Settings
            </p>
            <p className="rounded-sm px-1 py-1 sm:rounded-md sm:px-2 sm:py-2">
              Billing
            </p>
          </div>
        </aside>

        <section className="min-w-0 text-left">
          <div className="flex h-8 items-center justify-between border-b border-border px-2 sm:h-12 sm:px-4">
            <h2 className="text-[8px] font-semibold sm:text-sm">
              Design System
            </h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="inline-flex rounded-sm bg-secondary px-1.5 py-1 text-[6px] text-secondary-foreground sm:rounded-md sm:px-3 sm:py-1.5 sm:text-xs">
                Board
              </span>
              <span className="task-chip inline-flex h-5 items-center gap-0.5 rounded-sm px-1 text-[6px] text-primary sm:h-7 sm:gap-1 sm:rounded-md sm:px-2 sm:text-xs">
                <Bot className="size-2 sm:size-3" />
                Ask AI
              </span>
              <span className="flex size-5 items-center justify-center rounded-sm bg-foreground text-background sm:size-7 sm:rounded-md">
                <Plus className="size-2.5 sm:size-3.5" />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 p-2 sm:gap-3 sm:p-4">
            {boardColumns.map((column) => (
              <div className="min-w-0" key={column.title}>
                <div className="mb-1 flex h-5 items-center justify-between border-b border-border text-[6px] sm:mb-3 sm:h-8 sm:text-xs">
                  <span className="inline-flex items-center gap-1 text-muted-foreground sm:gap-2">
                    <span
                      className={cn("size-1 rounded-full sm:size-2", column.dot)}
                    />
                    {column.title}
                  </span>
                  <span className="rounded-sm bg-secondary px-1 py-0.5 text-[5px] text-muted-foreground sm:rounded sm:px-1.5 sm:text-[10px]">
                    {column.count}
                  </span>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  {column.tasks.map(([task, tag], index) => (
                    <article
                      className="task-card rounded-sm border border-border p-1 shadow-sm shadow-black/10 sm:rounded-md sm:p-3"
                      key={task}
                    >
                      <p className="mb-1 font-mono text-[5px] uppercase text-muted-foreground sm:mb-3 sm:text-[10px]">
                        ALP-{String(index + 1).padStart(3, "0")}
                      </p>
                      <p className="line-clamp-2 text-[6px] font-medium leading-[1.25] text-foreground sm:text-sm sm:leading-5">
                        {task}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-1 sm:mt-5 sm:gap-2">
                        <span className="task-chip inline-flex h-3.5 items-center gap-0.5 rounded-sm px-1 text-[5px] text-primary sm:h-6 sm:gap-1 sm:rounded-md sm:px-2 sm:text-[11px]">
                          <CircleDot className="size-1.5 sm:size-3" />
                          {tag}
                        </span>
                        <span className="flex size-3.5 items-center justify-center rounded-full bg-secondary text-[5px] text-muted-foreground sm:size-6 sm:text-[10px]">
                          {index === 0 ? "AK" : "MT"}
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
    </div>
  );
}
