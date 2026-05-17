---
inclusion: always
---

# Backend Stack & Conventions

This project uses **TanStack Start** with **Supabase** as the backend. All server-side logic lives in server functions using `createServerFn` from `@tanstack/react-start`.

## Stack

- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth (email/password) — client in `src/integrations/supabase/client.ts`, server client in `src/integrations/supabase/client.server.ts`
- **Storage:** Supabase Storage (buckets: `business-logos`, `business-gallery`)
- **Payments:** Stripe (subscriptions)
- **Email:** Resend
- **WhatsApp notifications:** Twilio
- **Google Reviews:** Google Places API (read-only, cached in Supabase)
- **Deploy:** Cloudflare Workers via Wrangler

## Server Functions Pattern

All server functions use `createServerFn` and live in `src/lib/*.functions.ts`:

```ts
import { createServerFn } from "@tanstack/react-start";
import { createServerSupabaseClient } from "@/integrations/supabase/client.server";

export const myFunction = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as MyInput)
  .handler(async ({ data }) => {
    const supabase = createServerSupabaseClient();
    // ... logic
  });
```

Existing server functions:
- `src/lib/waitlist.functions.ts` — `submitWaitlist`, `listWaitlist`

New functions go in:
- `src/lib/auth.functions.ts` — signUp, signIn, signOut, getSession
- `src/lib/business.functions.ts` — getBusinesses, getBusinessBySlug, getMyBusiness, updateMyBusiness
- `src/lib/leads.functions.ts` — submitLead, getMyLeads, updateLeadStatus
- `src/lib/storage.functions.ts` — uploadLogo, uploadPhoto, deletePhoto
- `src/lib/reviews.functions.ts` — connectGooglePlace, syncGoogleReviews, getReviews
- `src/lib/coupons.functions.ts` — getMyCoupons, createCoupon, toggleCoupon, deleteCoupon
- `src/lib/analytics.functions.ts` — logProfileView, getAnalytics
- `src/lib/stripe.functions.ts` — createCheckoutSession, createBillingPortalSession, handleStripeWebhook
- `src/lib/admin.functions.ts` — getAdminBusinesses, approveBusiness, lockBusiness, getAdminMetrics

## Supabase RLS Rules

Every table has Row Level Security enabled. Key policies:
- Public (anon) can read active businesses and their related data
- Authenticated users can only read/write their own data (`auth.uid() = owner_id`)
- Admin/manager role (`profiles.role IN ('admin','manager')`) can read/write all businesses
- Service role (server functions only) bypasses RLS for admin operations

## Environment Variables

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_PLACES_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PREMIUM_PRICE_ID
STRIPE_ULTRA_PRICE_ID
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
```

## Mock Data (current state — pre-backend)

All mock data lives in `src/lib/mock/`. Each accessor (`getBusinesses()`, `getBusinessBySlug()`, etc.) is a thin wrapper so swapping to a real server function is a one-line change per accessor.

## Full Backend Plan

See `docs/backend-implementation-plan.md` for the complete 10-phase implementation plan with SQL migrations, server function signatures, and frontend wiring instructions.
