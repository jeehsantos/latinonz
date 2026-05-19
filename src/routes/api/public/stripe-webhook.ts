import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { getStripe, handleStripeWebhook } from "@/lib/stripe.functions";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!signature || !webhookSecret) {
          return new Response("Missing signature or webhook secret", { status: 400 });
        }
        const rawBody = await request.text();
        const stripe = getStripe();
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            webhookSecret,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid signature";
          return new Response(`Webhook Error: ${message}`, { status: 400 });
        }
        try {
          await handleStripeWebhook(event);
        } catch (err) {
          console.error("[stripe-webhook] handler error", err);
          return new Response("Webhook handler failed", { status: 500 });
        }
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
