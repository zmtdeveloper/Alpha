import "server-only";

import Stripe from "stripe";

import type { Enums, Json, Tables } from "@/lib/database.types";
import { sendBillingUpgradeEmail } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getBillingPlan,
  getEffectiveBillingPlan,
  type BillingPlanId,
} from "@/lib/billing/plans";

type PaidBillingPlanId = Extract<BillingPlanId, "lite" | "pro">;
type BillingStatus = Enums<"billing_status">;
type BillingEventContext = Pick<Stripe.Event, "created" | "id" | "type">;
type BillingLookupRow = Pick<
  Tables<"workspace_billing">,
  "last_stripe_event_created" | "workspace_id"
>;
type PreviousBillingRow = Pick<Tables<"workspace_billing">, "plan" | "status">;
type WorkspaceEmailRow = Pick<Tables<"workspaces">, "name" | "owner_id" | "slug">;
type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

const stripeApiVersion = "2026-06-24.dahlia";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const apiKey = process.env.STRIPE_RESTRICTED_KEY;

  if (!apiKey) {
    throw new Error("Billing provider unavailable");
  }

  stripeClient = new Stripe(apiKey, {
    apiVersion: stripeApiVersion,
  });

  return stripeClient;
}

export function getStripePriceId(plan: PaidBillingPlanId) {
  const priceId =
    plan === "lite"
      ? process.env.STRIPE_LITE_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

  return priceId || null;
}

export function getPlanFromStripePriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return "free" satisfies BillingPlanId;
  }

  if (priceId === process.env.STRIPE_LITE_PRICE_ID) {
    return "lite" satisfies BillingPlanId;
  }

  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return "pro" satisfies BillingPlanId;
  }

  return "free" satisfies BillingPlanId;
}

export async function createWorkspaceCheckoutSession({
  customerId,
  origin,
  plan,
  user,
  workspace,
}: {
  customerId: string | null;
  origin: string;
  plan: PaidBillingPlanId;
  user: {
    email: string;
    id: string;
  };
  workspace: {
    id: number;
    name: string;
    slug: string;
  };
}) {
  const priceId = getStripePriceId(plan);

  if (!priceId) {
    throw new Error(`Billing plan unavailable for ${plan}`);
  }

  const stripe = getStripeClient();
  const workspaceId = String(workspace.id);

  return stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${origin}/${workspace.slug}/settings/billing?billing=checkout-canceled`,
    client_reference_id: workspaceId,
    customer: customerId ?? undefined,
    customer_email: customerId ? undefined : user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      plan,
      userId: user.id,
      workspaceId,
    },
    mode: "subscription",
    subscription_data: {
      description: `${workspace.name} workspace subscription`,
      metadata: {
        plan,
        userId: user.id,
        workspaceId,
      },
    },
    success_url: `${origin}/${workspace.slug}/settings/billing?billing=updating`,
  });
}

export async function createWorkspacePortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const stripe = getStripeClient();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export function constructStripeWebhookEvent(rawBody: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Billing webhook unavailable");
  }

  return getStripeClient().webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret,
  );
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
  rawBody: string,
) {
  const admin = createAdminClient();
  const eventCreated = timestampToIso(event.created);
  const payload = JSON.parse(rawBody) as Json;

  const { data: existingEvent, error: existingEventError } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEventError) {
    throw existingEventError;
  }

  if (existingEvent) {
    return { duplicate: true, processed: false };
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await syncCheckoutSession(event.data.object, event);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object, event);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await syncInvoiceSubscription(event.data.object, event);
      break;
    default:
      break;
  }

  const { error: insertEventError } = await admin
    .from("stripe_webhook_events")
    .insert({
      event_created: eventCreated,
      id: event.id,
      payload,
      type: event.type,
    });

  if (insertEventError) {
    if (insertEventError.code === "23505") {
      return { duplicate: true, processed: true };
    }

    throw insertEventError;
  }

  return { duplicate: false, processed: true };
}

async function syncCheckoutSession(
  session: Stripe.Checkout.Session,
  event: BillingEventContext,
) {
  const subscriptionId = stripeId(session.subscription);

  if (!subscriptionId) {
    return;
  }

  const subscription =
    typeof session.subscription === "object" && session.subscription
      ? session.subscription
      : await getStripeClient().subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"],
        });

  await syncSubscription(subscription, event);
}

async function syncInvoiceSubscription(
  invoice: Stripe.Invoice,
  event: BillingEventContext,
) {
  const subscriptionId = invoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await getStripeClient().subscriptions.retrieve(
    subscriptionId,
    {
      expand: ["items.data.price"],
    },
  );

  await syncSubscription(subscription, event);
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  event: BillingEventContext,
) {
  const customerId = stripeId(subscription.customer);
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const workspaceIdFromMetadata = numericMetadata(subscription.metadata.workspaceId);
  const lookup = await findBillingWorkspace({
    customerId,
    subscriptionId: subscription.id,
    workspaceId: workspaceIdFromMetadata,
  });

  if (!lookup) {
    return;
  }

  const eventCreated = timestampToIso(event.created);

  if (!eventCreated) {
    return;
  }

  if (
    lookup.last_stripe_event_created &&
    new Date(lookup.last_stripe_event_created).getTime() >
      new Date(eventCreated).getTime()
  ) {
    return;
  }

  const period = subscriptionPeriod(subscription);
  const admin = createAdminClient();
  const previousBilling = await getPreviousBilling(admin, lookup.workspace_id);
  const nextPlan = getPlanFromStripePriceId(priceId);
  const nextStatus = mapSubscriptionStatus(subscription.status);
  const { error } = await admin.from("workspace_billing").upsert(
    {
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: period.end,
      current_period_start: period.start,
      last_stripe_event_created: eventCreated,
      last_stripe_event_id: event.id,
      plan: nextPlan,
      status: nextStatus,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      stripe_subscription_id: subscription.id,
      workspace_id: lookup.workspace_id,
    },
    {
      onConflict: "workspace_id",
    },
  );

  if (error) {
    throw error;
  }

  await sendUpgradeEmailIfNeeded({
    admin,
    nextPlan,
    nextStatus,
    previousBilling,
    workspaceId: lookup.workspace_id,
  });
}

async function getPreviousBilling(
  admin: SupabaseAdminClient,
  workspaceId: number,
) {
  const { data, error } = await admin
    .from("workspace_billing")
    .select("plan, status")
    .eq("workspace_id", workspaceId)
    .maybeSingle<PreviousBillingRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function sendUpgradeEmailIfNeeded({
  admin,
  nextPlan,
  nextStatus,
  previousBilling,
  workspaceId,
}: {
  admin: SupabaseAdminClient;
  nextPlan: BillingPlanId;
  nextStatus: BillingStatus;
  previousBilling: PreviousBillingRow | null;
  workspaceId: number;
}) {
  if (!isPlanUpgrade(previousBilling, nextPlan, nextStatus)) {
    return;
  }

  const { data: workspace, error } = await admin
    .from("workspaces")
    .select("name, owner_id, slug")
    .eq("id", workspaceId)
    .maybeSingle<WorkspaceEmailRow>();

  if (error) {
    throw error;
  }

  if (!workspace) {
    return;
  }

  const { data: owner, error: ownerError } =
    await admin.auth.admin.getUserById(workspace.owner_id);

  if (ownerError) {
    throw ownerError;
  }

  const email = owner.user?.email;

  if (!email) {
    return;
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");

  await sendBillingUpgradeEmail({
    email,
    planName: getBillingPlan(nextPlan).name,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    workspaceUrl: `${origin}/${workspace.slug}/settings/billing`,
  });
}

function isPlanUpgrade(
  previousBilling: PreviousBillingRow | null,
  nextPlan: BillingPlanId,
  nextStatus: BillingStatus,
) {
  const previousPlan = getEffectiveBillingPlan(
    previousBilling?.plan,
    previousBilling?.status,
  );
  const effectiveNextPlan = getEffectiveBillingPlan(nextPlan, nextStatus);

  return planRank(effectiveNextPlan) > planRank(previousPlan);
}

function planRank(plan: BillingPlanId) {
  switch (plan) {
    case "pro":
      return 2;
    case "lite":
      return 1;
    default:
      return 0;
  }
}

async function findBillingWorkspace({
  customerId,
  subscriptionId,
  workspaceId,
}: {
  customerId: string | null;
  subscriptionId: string;
  workspaceId: number | null;
}) {
  const admin = createAdminClient();

  if (workspaceId) {
    const { data, error } = await admin
      .from("workspace_billing")
      .select("last_stripe_event_created, workspace_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle<BillingLookupRow>();

    if (error) {
      throw error;
    }

    return data ?? { last_stripe_event_created: null, workspace_id: workspaceId };
  }

  const bySubscription = await admin
    .from("workspace_billing")
    .select("last_stripe_event_created, workspace_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle<BillingLookupRow>();

  if (bySubscription.error) {
    throw bySubscription.error;
  }

  if (bySubscription.data) {
    return bySubscription.data;
  }

  if (!customerId) {
    return null;
  }

  const byCustomer = await admin
    .from("workspace_billing")
    .select("last_stripe_event_created, workspace_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<BillingLookupRow>();

  if (byCustomer.error) {
    throw byCustomer.error;
  }

  return byCustomer.data;
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): BillingStatus {
  switch (status) {
    case "active":
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
    case "trialing":
    case "unpaid":
      return status;
    default:
      return "inactive";
  }
}

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_end?: number | null;
    current_period_start?: number | null;
  };

  return {
    end: timestampToIso(item?.current_period_end ?? null),
    start: timestampToIso(item?.current_period_start ?? null),
  };
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceWithLegacySubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const legacySubscriptionId = stripeId(invoiceWithLegacySubscription.subscription);

  if (legacySubscriptionId) {
    return legacySubscriptionId;
  }

  const invoiceWithParent = invoice as Stripe.Invoice & {
    parent?: {
      subscription_details?: {
        subscription?: string | null;
      } | null;
    } | null;
  };

  return invoiceWithParent.parent?.subscription_details?.subscription ?? null;
}

function stripeId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function numericMetadata(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function timestampToIso(timestamp: number | null | undefined) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}
