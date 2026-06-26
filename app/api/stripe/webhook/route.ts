import {
  constructStripeWebhookEvent,
  processStripeWebhookEvent,
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;

  try {
    event = constructStripeWebhookEvent(rawBody, signature);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Billing webhook unavailable"
    ) {
      console.error("Billing webhook is unavailable");
      return Response.json(
        { error: "Webhook unavailable" },
        { status: 500 },
      );
    }

    console.error("Stripe webhook signature verification failed", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await processStripeWebhookEvent(event, rawBody);

    return Response.json({
      duplicate: result.duplicate,
      processed: result.processed,
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook could not be processed", error);

    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
