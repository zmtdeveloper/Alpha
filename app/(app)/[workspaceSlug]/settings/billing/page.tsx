import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Rocket,
  Users,
} from "lucide-react";

import { PricingCards } from "@/components/billing/pricing-cards";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "@/lib/billing/actions";
import { getWorkspaceBillingData } from "@/lib/billing/data";
import {
  formatUsageLimit,
  getBillingPlan,
  isPaidBillingPlan,
  isPaidBillingStatus,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ billing?: string | string[] }>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const data = await getWorkspaceBillingData(workspaceSlug);
  const plan = getBillingPlan(data.effectivePlan);
  const billingNotice = getBillingNotice(firstParam(query.billing));
  const usageWarnings = getUsageWarnings(data);
  const rawPaidPlan =
    isPaidBillingPlan(data.billing.plan) &&
    isPaidBillingStatus(data.billing.status);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Billing
          </h1>
        </div>
        {data.canManageBilling && data.billing.stripe_customer_id ? (
          <form action={openBillingPortal}>
            <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
            <Button type="submit" variant="outline">
              <ExternalLink />
              Manage billing
            </Button>
          </form>
        ) : (
          <div className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground">
            <CreditCard className="size-4" />
            {data.canManageBilling ? "Billing active" : "Read-only access"}
          </div>
        )}
      </section>

      {billingNotice ? (
        <StatusNotice tone={billingNotice.tone}>
          {billingNotice.message}
        </StatusNotice>
      ) : null}

      {usageWarnings.map((warning) => (
        <StatusNotice key={warning} tone="warning">
          {warning}
        </StatusNotice>
      ))}

      <section className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.45fr)]">
        <article className="task-card rounded-md border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {plan.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {rawPaidPlan
                  ? `${plan.name} limits are active for this workspace.`
                  : "Free limits apply until Stripe reports an active or trialing paid subscription."}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex h-8 w-fit items-center rounded-md border px-2 text-xs font-medium capitalize",
                rawPaidPlan
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-accent text-muted-foreground",
              )}
            >
              {statusLabel(data.billing.status)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <UsageTile
              icon={Users}
              label="Active users"
              value={formatUsageLimit(data.activeMemberCount, data.memberLimit)}
            />
            <UsageTile
              icon={Users}
              label="Users + pending invites"
              value={formatUsageLimit(data.reservedMemberCount, data.memberLimit)}
            />
            <UsageTile
              icon={Rocket}
              label="Projects"
              value={formatUsageLimit(data.projectCount, data.projectLimit)}
            />
          </div>
        </article>

        <aside className="task-card rounded-md border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="task-chip flex size-9 items-center justify-center rounded-md text-primary">
              <CreditCard className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Billing record</h2>
              <p className="text-xs text-muted-foreground">
                {data.billing.last_stripe_event_created
                  ? `Last event ${formatDateTime(data.billing.last_stripe_event_created)}`
                  : "No billing event received"}
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <BillingFact label="Configured plan" value={getBillingPlan(data.billing.plan).name} />
            <BillingFact label="Effective plan" value={plan.name} />
            <BillingFact
              label="Renews"
              value={
                data.billing.current_period_end
                  ? formatDate(data.billing.current_period_end)
                  : "Not scheduled"
              }
            />
            <BillingFact
              label="Cancellation"
              value={
                data.billing.cancel_at_period_end
                  ? "Cancels at period end"
                  : "Not scheduled"
              }
            />
          </dl>
        </aside>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Owners can start Checkout or open the Stripe Customer Portal.
            Admins and members can review billing state.
          </p>
        </div>
        <PricingCards
          billingStatus={data.billing.status}
          canManageBilling={data.canManageBilling}
          currentPlanId={data.effectivePlan}
          mode="dashboard"
          workspaceSlug={workspaceSlug}
        />
      </section>
    </div>
  );
}

function StatusNotice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "info" | "warning";
}) {
  const Icon = tone === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
        tone === "warning"
          ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
      role="status"
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function UsageTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="task-chip rounded-md px-3 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function BillingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  );
}

function getUsageWarnings(data: Awaited<ReturnType<typeof getWorkspaceBillingData>>) {
  const warnings: string[] = [];

  if (data.memberLimit !== null && data.activeMemberCount > data.memberLimit) {
    warnings.push(
      `This workspace has ${data.activeMemberCount} active users, above the ${data.memberLimit}-user ${getBillingPlan(data.effectivePlan).name} limit. Existing users stay active, but new invitations are blocked.`,
    );
  } else if (
    data.memberLimit !== null &&
    data.reservedMemberCount > data.memberLimit
  ) {
    warnings.push(
      `Active users plus pending invitations exceed the ${data.memberLimit}-user ${getBillingPlan(data.effectivePlan).name} limit. Revoke pending invites or upgrade before sending more.`,
    );
  }

  if (data.projectLimit !== null && data.projectCount > data.projectLimit) {
    warnings.push(
      `This workspace has ${data.projectCount} projects, above the ${data.projectLimit}-project ${getBillingPlan(data.effectivePlan).name} limit. Existing projects stay available, but new projects are blocked.`,
    );
  }

  return warnings;
}

function getBillingNotice(code: string | null) {
  switch (code) {
    case "updating":
      return {
        message:
          "Checkout is complete. Billing access will update after Stripe sends the subscription webhook.",
        tone: "info" as const,
      };
    case "checkout-canceled":
      return {
        message: "Checkout was canceled. No subscription changes were applied.",
        tone: "warning" as const,
      };
    case "owner-required":
      return {
        message: "Only workspace owners can start Checkout or open the portal.",
        tone: "warning" as const,
      };
    case "no-customer":
      return {
        message: "Billing management is not available for this workspace yet.",
        tone: "warning" as const,
      };
    case "configuration-error":
      return {
        message: "Billing actions are unavailable in this environment.",
        tone: "warning" as const,
      };
    default:
      return null;
  }
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
