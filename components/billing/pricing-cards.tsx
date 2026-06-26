import {
  Check,
  CreditCard,
  Gauge,
  Infinity,
  Rocket,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { openBillingPortal, startBillingCheckout } from "@/lib/billing/actions";
import {
  billingPlans,
  isPaidBillingPlan,
  type BillingPlan,
  type BillingPlanId,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type PricingCardsProps = {
  billingStatus?: string;
  canManageBilling?: boolean;
  currentPlanId?: BillingPlanId;
  mode: "dashboard" | "public";
  publicCtaHref?: string;
  publicCtaLabel?: string;
  workspaceSlug?: string;
};

const planIcons = {
  free: Gauge,
  lite: Users,
  pro: Infinity,
} satisfies Record<BillingPlanId, React.ComponentType<{ className?: string }>>;

export function PricingCards({
  billingStatus,
  canManageBilling = false,
  currentPlanId,
  mode,
  publicCtaHref = "/signup",
  publicCtaLabel = "Create workspace",
  workspaceSlug,
}: PricingCardsProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {billingPlans.map((plan) => (
        <PricingCard
          billingStatus={billingStatus}
          canManageBilling={canManageBilling}
          currentPlanId={currentPlanId}
          key={plan.id}
          mode={mode}
          plan={plan}
          publicCtaHref={publicCtaHref}
          publicCtaLabel={publicCtaLabel}
          workspaceSlug={workspaceSlug}
        />
      ))}
    </section>
  );
}

function PricingCard({
  billingStatus,
  canManageBilling = false,
  currentPlanId,
  mode,
  plan,
  publicCtaHref = "/signup",
  publicCtaLabel = "Create workspace",
  workspaceSlug,
}: PricingCardsProps & { plan: BillingPlan }) {
  const Icon = planIcons[plan.id];
  const isCurrent = currentPlanId === plan.id;
  const isPro = plan.id === "pro";

  return (
    <article
      className={cn(
        "task-card flex min-h-[27rem] flex-col rounded-md border border-border p-4 shadow-sm shadow-black/10",
        isCurrent && "border-primary/70",
        isPro && !isCurrent && "border-sky-300/35",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "task-chip flex size-9 items-center justify-center rounded-md",
              isPro && "text-sky-200",
              plan.id === "lite" && "text-primary",
            )}
          >
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">{plan.name}</h2>
            <p className="text-xs text-muted-foreground">
              {plan.memberLimitLabel}
            </p>
          </div>
        </div>
        {isCurrent ? (
          <span className="inline-flex h-7 items-center rounded-md border border-primary/40 bg-primary/10 px-2 text-xs font-medium text-primary">
            Current
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex items-end gap-1">
        <span className="text-3xl font-semibold tracking-tight">
          {plan.price}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">
          {plan.id === "free" ? "" : "/mo"}
        </span>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
        {plan.description}
      </p>

      <div className="mt-5 grid gap-2 text-sm">
        <PlanLimit icon={Users} label={plan.memberLimitLabel} />
        <PlanLimit icon={Rocket} label={plan.projectLimitLabel} />
      </div>

      <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
        {plan.features.map((feature) => (
          <li className="flex gap-2" key={feature}>
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        {mode === "public" ? (
          <Button asChild className="w-full" variant={isPro ? "default" : "outline"}>
            <Link href={publicCtaHref}>{publicCtaLabel}</Link>
          </Button>
        ) : (
          <DashboardPlanAction
            billingStatus={billingStatus}
            canManageBilling={canManageBilling}
            isCurrent={isCurrent}
            plan={plan}
            workspaceSlug={workspaceSlug}
          />
        )}
      </div>
    </article>
  );
}

function DashboardPlanAction({
  billingStatus,
  canManageBilling,
  isCurrent,
  plan,
  workspaceSlug,
}: {
  billingStatus?: string;
  canManageBilling: boolean;
  isCurrent: boolean;
  plan: BillingPlan;
  workspaceSlug?: string;
}) {
  if (!workspaceSlug) {
    return null;
  }

  if (!canManageBilling) {
    return (
      <Button className="w-full" disabled variant="outline">
        <CreditCard />
        Owner action
      </Button>
    );
  }

  if (!isPaidBillingPlan(plan.id)) {
    if (billingStatus && billingStatus !== "inactive") {
      return (
        <form action={openBillingPortal}>
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          <Button className="w-full" type="submit" variant="outline">
            <CreditCard />
            Manage billing
          </Button>
        </form>
      );
    }

    return (
      <Button className="w-full" disabled variant="outline">
        Current plan
      </Button>
    );
  }

  return (
    <form action={startBillingCheckout}>
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <input name="plan" type="hidden" value={plan.id} />
      <Button className="w-full" type="submit" variant={isCurrent ? "outline" : "default"}>
        <CreditCard />
        {isCurrent ? "Manage billing" : `Choose ${plan.name}`}
      </Button>
    </form>
  );
}

function PlanLimit({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="task-chip inline-flex h-8 items-center gap-2 rounded-md px-2 text-muted-foreground">
      <Icon className="size-4 text-foreground" />
      {label}
    </span>
  );
}
