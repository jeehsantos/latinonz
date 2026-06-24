## Root cause

The Stripe webhook returns 200 but the profile never gets updated to `premium`. Looking at the delivered events (`invoice.paid`, `invoice.finalized`, `invoice.created`, `payment_intent.succeeded`, `payment_intent.created`) and the handler in `src/lib/stripe.functions.ts`, the handler only switches on:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

For this new subscription, Stripe is delivering `invoice.paid` (and `customer.subscription.created`, which isn't enabled either) but **not** `checkout.session.completed` to this endpoint — so the handler hits the `default` branch and silently returns 200 without writing anything. The polling page then times out into "Almost there".

## Fix

### 1. Handle the actually-delivered activation events

In `src/lib/stripe.functions.ts`, extend `handleStripeWebhook` to also handle:

- `customer.subscription.created` → call `updateProfileFromSubscription` (same path as `.updated`).
- `invoice.paid` and `invoice.payment_succeeded` → if the invoice has a `subscription` (or `parent.subscription_details.subscription`), retrieve that subscription and call `updateProfileFromSubscription`. Backfill `subscription.metadata.supabase_user_id` from the invoice line metadata (the delivered payload has it on `lines.data[0].metadata.supabase_user_id`) when missing, so the profile lookup works.

This makes activation resilient regardless of which of the standard subscription lifecycle events Stripe sends first.

### 2. Make the success page recover the missed activation

In `src/routes/dashboard.checkout-success.tsx`, while polling, if after ~5s the tier is still `starter`, call a new server function `syncSubscriptionFromStripe` that:

- Looks up the current user's `stripe_customer_id` from `profiles`.
- Lists that customer's subscriptions via Stripe (`stripe.subscriptions.list({ customer, status: "all", limit: 1 })`).
- If an active/trialing/past_due sub exists, runs `updateProfileFromSubscription` against it.
- Returns the resolved tier.

The page then re-checks the profile. This both fixes the current stuck user and protects against any future missed-webhook timing race without changing the polling UX for the common happy path.

### 3. Resend the stuck event (manual step for the user)

After deploying, the user should go into Stripe Dashboard → the dev webhook endpoint → find the `invoice.paid` event from `2:50:48 AM` and click **Resend**. That single resend will flip the existing `starter@gmail.com` profile to `premium`. Alternatively, just clicking "Go to dashboard" on the stuck page will now self-heal via the new sync server function.

## Technical notes

- No DB migration needed.
- No change to `src/routes/api/public/stripe-webhook.ts` (signature verification stays as-is).
- `syncSubscriptionFromStripe` uses `requireSupabaseAuth` so it's scoped to the signed-in user; it then uses the admin client (dynamic import) only to update that user's own profile row.
- Keeps the existing `checkout.session.completed` branch intact for any future setups where Stripe does deliver it first.
