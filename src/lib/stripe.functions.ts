import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StripePlanTier = "premium" | "ultra";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

function priceIdFor(tier: StripePlanTier): string {
  const id =
    tier === "premium" ? process.env.STRIPE_PREMIUM_PRICE_ID : process.env.STRIPE_ULTRA_PRICE_ID;
  if (!id) throw new Error(`Stripe price id for ${tier} is not configured`);
  return id;
}

function tierFromPriceId(priceId: string | null | undefined): StripePlanTier | "starter" {
  if (!priceId) return "starter";
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) return "ultra";
  return "starter";
}

function appOrigin(): string {
  return (
    process.env.APP_PUBLIC_URL ??
    process.env.PUBLIC_URL ??
    "https://latinonz.lovable.app"
  ).replace(/\/$/, "");
}

async function ensureCustomer(stripe: Stripe, userId: string, email?: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { supabase_user_id: userId },
  });
  await supabaseAdmin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ planTier: z.enum(["premium", "ultra"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const stripe = getStripe();
    const { userId, claims } = context;
    const email = (claims as { email?: string } | null)?.email ?? null;
    const customerId = await ensureCustomer(stripe, userId, email);

    const origin = appOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdFor(data.planTier), quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard/upgrade?checkout=cancelled`,
      metadata: { supabase_user_id: userId, plan_tier: data.planTier },
      subscription_data: {
        metadata: { supabase_user_id: userId, plan_tier: data.planTier },
      },
    });

    return { ok: true as const, url: session.url };
  });

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();
    const { userId } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.stripe_customer_id) {
      return { ok: false as const, error: "No active subscription found" };
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appOrigin()}/dashboard/settings`,
    });
    return { ok: true as const, url: portal.url };
  });

async function updateProfileFromSubscription(sub: Stripe.Subscription) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const userIdFromMeta = sub.metadata?.supabase_user_id ?? null;

  const tier = sub.status === "canceled" ? "starter" : tierFromPriceId(priceId);

  const update = {
    plan_tier: tier,
    subscription_status: sub.status,
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
  };

  if (userIdFromMeta) {
    await supabaseAdmin.from("profiles").update(update).eq("id", userIdFromMeta);
    return;
  }
  await supabaseAdmin.from("profiles").update(update).eq("stripe_customer_id", customerId);
}

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stripe = getStripe();
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id ?? null;
      const customerId =
        typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription?.id ?? null);

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (userId && !sub.metadata?.supabase_user_id) {
          await stripe.subscriptions.update(subscriptionId, {
            metadata: { ...sub.metadata, supabase_user_id: userId },
          });
          sub.metadata = { ...sub.metadata, supabase_user_id: userId };
        }
        await updateProfileFromSubscription(sub);
      } else if (userId && customerId) {
        await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId, subscription_status: "active" })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated": {
      await updateProfileFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const userIdFromMeta = sub.metadata?.supabase_user_id ?? null;
      const downgrade = {
        plan_tier: "starter",
        subscription_status: "canceled",
        stripe_subscription_id: null,
      };
      if (userIdFromMeta) {
        await supabaseAdmin.from("profiles").update(downgrade).eq("id", userIdFromMeta);
      } else {
        await supabaseAdmin.from("profiles").update(downgrade).eq("stripe_customer_id", customerId);
      }
      break;
    }
    default:
      break;
  }
}
