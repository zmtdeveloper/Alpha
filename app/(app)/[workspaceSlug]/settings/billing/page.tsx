import { CreditCard, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Billing
          </h1>
        </div>
        <Button variant="outline">
          <ExternalLink />
          Portal
        </Button>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            <h2 className="font-semibold">Lite</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Workspace collaboration for small teams that need shared boards and
            predictable member access.
          </p>
          <p className="mt-5 text-2xl font-semibold">$19</p>
        </article>
        <article className="rounded-lg border border-primary/50 bg-card p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            <h2 className="font-semibold">Pro</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Advanced workspace controls, larger teams, and future AI-assisted
            task workflows.
          </p>
          <p className="mt-5 text-2xl font-semibold">$49</p>
        </article>
      </section>
    </div>
  );
}
