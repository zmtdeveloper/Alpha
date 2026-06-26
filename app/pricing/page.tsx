import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import Link from "next/link";

import { PricingCards } from "@/components/billing/pricing-cards";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getWorkspaceMemberships } from "@/lib/auth/data";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const workspaces = user ? await getWorkspaceMemberships() : [];
  const firstWorkspace = workspaces[0];
  const ctaHref = firstWorkspace
    ? `/${firstWorkspace.slug}/settings/billing`
    : user
      ? "/onboarding"
      : "/signup";
  const ctaLabel = firstWorkspace ? "Open billing" : "Create workspace";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          href="/"
        >
          <ArrowLeft className="size-4" />
          Alpha
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.45fr)] lg:px-10">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Workspace billing
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Plans that cap creation, not your existing work.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Free stays useful for one-person workspaces. Lite opens small-team
            collaboration, and Pro removes member and project caps as the team
            grows.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Open workspace</Link>
            </Button>
          </div>
        </div>

        <aside className="task-card rounded-md border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="task-chip flex size-9 items-center justify-center rounded-md text-primary">
              <CreditCard className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Billing state</h2>
              <p className="text-xs text-muted-foreground">
                Synced from Stripe webhooks
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            {[
              "Downgrades keep existing projects and members in place.",
              "New projects stop at the active workspace limit.",
              "Pending invitations reserve member capacity.",
            ].map((item) => (
              <p className="flex gap-2" key={item}>
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </aside>
      </section>

      <div className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <PricingCards
          mode="public"
          publicCtaHref={ctaHref}
          publicCtaLabel={ctaLabel}
        />
      </div>
    </main>
  );
}
