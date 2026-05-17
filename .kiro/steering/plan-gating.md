---
inclusion: always
---

# Plan Gating System

This project has three subscription tiers: **Starter** (free), **Premium** (NZ$49/mo), **Ultra** (NZ$99/mo).

## Source of Truth

All feature gates live in `src/lib/plans.ts`. Never hardcode plan logic elsewhere.

```ts
import { can, getLimit } from "@/lib/plans";

can(plan, "coupons")        // boolean — is this feature available?
getLimit(plan, "photoLimit") // number — what's the limit? (Infinity = unlimited)
```

## Feature Gate Reference

| Feature key | Starter | Premium | Ultra |
|---|---|---|---|
| `contactModal` | ✓ | — | — |
| `leadWhatsapp` | — | ✓ | ✓ |
| `leadEmail` | ✓ | — | ✓ |
| `photoLimit` | 3 | ∞ | ∞ |
| `businessHours` | — | ✓ | ✓ |
| `serviceOptions` | — | ✓ | ✓ |
| `coupons` | — | ✓ | ✓ |
| `directMessages` | — | ✓ | ✓ |
| `qrCode` | — | ✓ | ✓ |
| `analytics` | — | ✓ | ✓ |
| `events` | — | — | ✓ |
| `socialPosts` | — | — | ✓ |
| `whatsappCommunity` | — | — | ✓ |
| `topPlacement` | — | — | ✓ |

## Contact Flow by Plan (public profile `/business/$slug`)

- **Starter** → button opens a modal form (name + email/WhatsApp + message) → lead saved → email sent to owner via Resend. No WhatsApp button shown.
- **Premium** → "Chat on WhatsApp" button → redirect to `wa.me/{phone}` → lead registered → WhatsApp notification to owner via Twilio.
- **Ultra** → "Chat on WhatsApp" button → redirect to `wa.me/{phone}` → lead registered → WhatsApp + email to owner.

## What Starter profiles show publicly

Starter profiles do **not** display: hours of operation, service options (take away / dine in / delivery / booking), or coupons. These sections are hidden entirely on the public profile — not just locked.

## Dashboard Locked Features

When a feature is unavailable for the current plan, render `<LockedFeatureCard>` from `src/components/dashboard/LockedFeatureCard.tsx` instead of the real UI.

```tsx
import { can } from "@/lib/plans";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";

if (!can(plan, "analytics")) {
  return <LockedFeatureCard title="..." description="..." requiredPlan="premium" />;
}
```

## Getting the Current Plan

During development, use `useCurrentPlan()` from `src/lib/dev-plan.ts` (mock, switchable via `?dev=1`).
After backend is wired, this will read from `profiles.plan_tier` in Supabase — the hook signature stays the same.

## Profile Moderation States

- `is_verified = false` → badge "Em verificação" shown on public profile
- `is_verified = true` → badge "Verificado" shown on public profile
- `is_active = false` → profile hidden from the network entirely (blocked by admin)
