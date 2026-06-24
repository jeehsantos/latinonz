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

function appOrigin(requestOrigin?: string | null): string {
  if (requestOrigin && /^https?:\/\//.test(requestOrigin)) {
    return requestOrigin.replace(/\/$/, "");
  }
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
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const stripe = getStripe();
    const { userId, claims } = context;
    const email = (claims as { email?: string } | null)?.email ?? null;
    const customerId = await ensureCustomer(stripe, userId, email);

    const originHeader = getRequestHeader("origin") ?? getRequestHeader("referer") ?? null;
    let inferredOrigin: string | null = null;
    if (originHeader) {
      try {
        inferredOrigin = new URL(originHeader).origin;
      } catch {
        inferredOrigin = null;
      }
    }
    const origin = appOrigin(inferredOrigin);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdFor(data.planTier), quantity: 1 }],
      success_url: `${origin}/dashboard/checkout-success`,
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
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await updateProfileFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
        parent?: { subscription_details?: { subscription?: string | null } | null } | null;
      };
      const subFromTop =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : (invoice.subscription?.id ?? null);
      const subFromParent = invoice.parent?.subscription_details?.subscription ?? null;
      const subscriptionId = subFromTop ?? subFromParent ?? null;
      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (!sub.metadata?.supabase_user_id) {
        const lineMetaUser = invoice.lines?.data?.[0]?.metadata?.supabase_user_id ?? null;
        if (lineMetaUser) {
          await stripe.subscriptions.update(subscriptionId, {
            metadata: { ...sub.metadata, supabase_user_id: lineMetaUser },
          });
          sub.metadata = { ...sub.metadata, supabase_user_id: lineMetaUser };
        }
      }
      await updateProfileFromSubscription(sub);
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

const PLAN_RANK = { starter: 0, premium: 1, ultra: 2 } as const;

export const getSubscriptionSchedule = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id, plan_tier")
      .eq("id", context.userId)
      .maybeSingle();
    const currentTier = (profile?.plan_tier ?? "starter") as "starter" | "premium" | "ultra";
    if (!profile?.stripe_subscription_id) {
      return {
        ok: true as const,
        currentTier,
        periodEnd: null as number | null,
        pendingTier: null as null | "starter" | "premium" | "ultra",
      };
    }
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const item = sub.items.data[0];
    const periodEnd =
      (item as unknown as { current_period_end?: number })?.current_period_end ??
      (sub as unknown as { current_period_end?: number })?.current_period_end ??
      null;
    let pendingTier: null | "starter" | "premium" | "ultra" = null;
    if (sub.cancel_at_period_end) pendingTier = "starter";
    if (sub.schedule) {
      const sid = typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(sid);
        const now = Math.floor(Date.now() / 1000);
        const nextPhase = schedule.phases.find((p) => (p.start_date ?? 0) > now);
        const nextPrice = nextPhase?.items?.[0]?.price;
        if (typeof nextPrice === "string") {
          const nextTier = tierFromPriceId(nextPrice);
          if (PLAN_RANK[nextTier] < PLAN_RANK[currentTier]) pendingTier = nextTier;
        }
      } catch {
        // ignore
      }
    }
    return { ok: true as const, currentTier, periodEnd, pendingTier };
  });

export const scheduleDowngrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ targetTier: z.enum(["starter", "premium"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id, plan_tier")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.stripe_subscription_id) {
      return { ok: false as const, error: "no_subscription" };
    }
    const currentTier = (profile.plan_tier ?? "starter") as "starter" | "premium" | "ultra";
    if (PLAN_RANK[data.targetTier] >= PLAN_RANK[currentTier]) {
      return { ok: false as const, error: "not_a_downgrade" };
    }

    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const item = sub.items.data[0];
    const periodEnd =
      (item as unknown as { current_period_end?: number })?.current_period_end ??
      (sub as unknown as { current_period_end?: number })?.current_period_end ??
      null;

    if (data.targetTier === "starter") {
      if (sub.schedule) {
        const sid = typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
        try {
          await stripe.subscriptionSchedules.release(sid);
        } catch {
          // ignore
        }
      }
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    } else {
      // ultra -> premium: schedule price change at period end
      const newPrice = priceIdFor(data.targetTier);
      const currentPriceId = item.price.id;
      let scheduleId =
        typeof sub.schedule === "string" ? sub.schedule : (sub.schedule?.id ?? null);
      if (!scheduleId) {
        const created = await stripe.subscriptionSchedules.create({ from_subscription: sub.id });
        scheduleId = created.id;
      }
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
      const firstStart = schedule.phases[0]?.start_date;
      await stripe.subscriptionSchedules.update(scheduleId, {
        end_behavior: "release",
        phases: [
          {
            items: [{ price: currentPriceId, quantity: 1 }],
            start_date: firstStart,
            end_date: periodEnd ?? undefined,
            proration_behavior: "none",
          },
          {
            items: [{ price: newPrice, quantity: 1 }],
            proration_behavior: "none",
            metadata: { supabase_user_id: context.userId, plan_tier: data.targetTier },
          },
        ],
      });
      if (sub.cancel_at_period_end) {
        await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
      }
    }

    return { ok: true as const, effectiveAt: periodEnd, targetTier: data.targetTier };
  });

export const cancelScheduledDowngrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.stripe_subscription_id) return { ok: false as const, error: "no_subscription" };
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    if (sub.schedule) {
      const sid = typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
      try {
        await stripe.subscriptionSchedules.release(sid);
      } catch {
        // ignore
      }
    }
    if (sub.cancel_at_period_end) {
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
    }
    return { ok: true as const };
  });

export const syncSubscriptionFromStripe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();
    const { userId } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, plan_tier")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return { ok: false as const, error: "no_customer" };
    }

    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 5,
    });
    const active = subs.data.find((s) =>
      ["active", "trialing", "past_due", "incomplete"].includes(s.status),
    );
    if (!active) {
      return { ok: false as const, error: "no_subscription" };
    }
    if (!active.metadata?.supabase_user_id) {
      await stripe.subscriptions.update(active.id, {
        metadata: { ...active.metadata, supabase_user_id: userId },
      });
      active.metadata = { ...active.metadata, supabase_user_id: userId };
    }
    await updateProfileFromSubscription(active);

    const { data: updated } = await supabaseAdmin
      .from("profiles")
      .select("plan_tier")
      .eq("id", userId)
      .maybeSingle();
    return { ok: true as const, tier: updated?.plan_tier ?? "starter" };
  });
