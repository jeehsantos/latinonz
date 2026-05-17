---
inclusion: always
---

# Lovable Prompt Guide — How to Implement This Project Efficiently

This file contains ready-to-use prompts for each backend phase. Copy-paste them directly into Lovable to minimise back-and-forth and credit usage.

## General Rules for Prompting Lovable

1. **One phase at a time.** Never ask for multiple phases in a single prompt — Lovable will make mistakes and you'll spend credits fixing them.
2. **Reference the plan.** Always say "follow `docs/backend-implementation-plan.md` Phase X" so Lovable reads the spec instead of guessing.
3. **Specify what NOT to change.** Lovable tends to refactor things it shouldn't. Explicitly say "do not modify existing files unless listed."
4. **Ask for the migration first, then the server function, then the frontend wiring** — in separate prompts if the phase is large.

---

## Phase 1 — Auth & Profiles

### Prompt 1A — Database migration
```
Create a Supabase migration for the `profiles` table and the `handle_new_user` trigger as specified in docs/backend-implementation-plan.md Phase 1.1. Only create the SQL migration file in supabase/migrations/. Do not modify any existing files.
```

### Prompt 1B — Server functions
```
Create src/lib/auth.functions.ts with the server functions: signUp, signIn, signOut, getSession. Follow the server function pattern in .kiro/steering/backend-stack.md. Use createServerFn from @tanstack/react-start and the Supabase server client from src/integrations/supabase/client.server.ts.
```

### Prompt 1C — Wire login and register pages
```
Wire src/routes/login.tsx and src/routes/cadastro.tsx to use the auth server functions from src/lib/auth.functions.ts. Add auth middleware to protect /dashboard/* routes — redirect to /login if no session. Do not change the visual design of these pages.
```

---

## Phase 2 — Businesses Table

### Prompt 2A — Migration
```
Create Supabase migrations for the tables: businesses, business_hours, service_options — as specified in docs/backend-implementation-plan.md Phase 2. Create only the SQL migration files. Do not modify any existing files.
```

### Prompt 2B — Server functions
```
Create src/lib/business.functions.ts with: getBusinesses, getBusinessBySlug, getMyBusiness, updateMyBusiness, updateBusinessHours, updateServiceOptions. Follow the pattern in .kiro/steering/backend-stack.md. Reference docs/backend-implementation-plan.md Phase 2.4 for the full function signatures.
```

### Prompt 2C — Wire directory and profile pages
```
Replace the mock data accessors in src/routes/directory.tsx, src/components/directory/DirectoryHome.tsx, and src/routes/business.$slug.tsx with the real server functions from src/lib/business.functions.ts. Wire src/routes/dashboard/profile.tsx to use getMyBusiness() and updateMyBusiness(). Do not change any visual design or layout.
```

---

## Phase 3 — Storage (Logo & Gallery)

### Prompt 3A — Buckets and migration
```
Create a Supabase migration for the business_photos table and storage bucket policies as specified in docs/backend-implementation-plan.md Phase 3. Create only the SQL migration file.
```

### Prompt 3B — Server functions and frontend wiring
```
Create src/lib/storage.functions.ts with: uploadLogo, uploadPhoto, deletePhoto, reorderPhotos. Then wire the logo upload in src/routes/dashboard/profile.tsx and the gallery grid in src/routes/dashboard/gallery.tsx to use these functions. Enforce the photoLimit from src/lib/plans.ts — Starter max 3 photos. Do not change any visual design.
```

---

## Phase 4 — Google Reviews

### Prompt 4A — Migration
```
Create a Supabase migration for the google_reviews table as specified in docs/backend-implementation-plan.md Phase 4.1. Create only the SQL migration file.
```

### Prompt 4B — Server functions
```
Create src/lib/reviews.functions.ts with: connectGooglePlace, syncGoogleReviews, getReviews. The sync function calls the Google Places API using GOOGLE_PLACES_API_KEY and upserts results into the google_reviews table. Reference docs/backend-implementation-plan.md Phase 4.2 and 4.3 for the API endpoint and field details.
```

### Prompt 4C — Wire frontend
```
In src/routes/dashboard/profile.tsx, add a "Google Reviews" section where the owner can enter their Google Place ID and trigger a sync. In src/routes/business.$slug.tsx, replace the mock REVIEWS_BY_BUSINESS with getReviews() from src/lib/reviews.functions.ts. Do not change any other part of these files.
```

---

## Phase 5 — Leads & Notifications

### Prompt 5A — Migration
```
Create a Supabase migration for the leads table as specified in docs/backend-implementation-plan.md Phase 5.1. Create only the SQL migration file.
```

### Prompt 5B — Server functions
```
Create src/lib/leads.functions.ts with: submitLead, getMyLeads, updateLeadStatus. The submitLead function must check the business owner's plan_tier and send notifications accordingly: Starter → email via Resend; Premium → WhatsApp via Twilio; Ultra → WhatsApp + email. Reference docs/backend-implementation-plan.md Phase 5.3 for the exact notification logic.
```

### Prompt 5C — Wire contact button on public profile
```
In src/routes/business.$slug.tsx, wire the contact section to use the real submitLead server function. The contact UI already renders correctly per plan (modal form for Starter, WhatsApp button for Premium/Ultra) — just replace the placeholder onClick handlers with real calls to submitLead from src/lib/leads.functions.ts.
```

### Prompt 5D — Wire leads dashboard
```
In src/routes/dashboard/leads.tsx, replace the mock LEADS import with getMyLeads() from src/lib/leads.functions.ts. Wire the "Responder" and "Marcar resolvido" buttons to call updateLeadStatus(). Do not change the visual design.
```

---

## Phase 6 — Coupons

### Prompt 6A — Migration + server functions + frontend
```
Create a Supabase migration for the coupons table (docs/backend-implementation-plan.md Phase 6.1). Create src/lib/coupons.functions.ts with getMyCoupons, createCoupon, toggleCoupon, deleteCoupon. Wire src/routes/dashboard/coupons.tsx to use these functions — replace the mock data. The "Novo cupom" button should open a form that calls createCoupon(). Verify the plan gate: only Premium and Ultra can access this feature (use can(plan, "coupons") from src/lib/plans.ts).
```

---

## Phase 7 — Analytics

### Prompt 7A — Migration + server functions + frontend
```
Create a Supabase migration for the profile_views table (docs/backend-implementation-plan.md Phase 7.1). Create src/lib/analytics.functions.ts with logProfileView and getAnalytics. Call logProfileView() in the loader of src/routes/business.$slug.tsx. Wire src/routes/dashboard/analytics.tsx to use getAnalytics() — replace the mock stat values. Verify the plan gate: only Premium and Ultra can access analytics (use can(plan, "analytics") from src/lib/plans.ts).
```

---

## Phase 8 — Stripe Payments

### Prompt 8A — Server functions
```
Create src/lib/stripe.functions.ts with: createCheckoutSession, createBillingPortalSession, handleStripeWebhook. The webhook handler must process: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted — updating profiles.plan_tier in Supabase accordingly. Reference docs/backend-implementation-plan.md Phase 8.2.
```

### Prompt 8B — Wire upgrade page and settings
```
In src/routes/dashboard/upgrade.tsx, wire the "Assinar Premium" and "Assinar Ultra" buttons to call createCheckoutSession() from src/lib/stripe.functions.ts. In src/routes/dashboard/settings.tsx, wire the "Mudar plano" button to call createBillingPortalSession(). Replace the mock useCurrentPlan() hook with a real hook that reads profiles.plan_tier from Supabase.
```

---

## Phase 9 — Admin Panel

### Prompt 9A — Policies + server functions
```
Create a Supabase migration adding admin/manager RLS policies to the businesses table (docs/backend-implementation-plan.md Phase 9.1). Create src/lib/admin.functions.ts with: getAdminBusinesses, approveBusiness, lockBusiness, unlockBusiness, getAdminMetrics, getAdminManagers, inviteManager, removeManager.
```

### Prompt 9B — Wire admin pages
```
Wire the following admin pages to use real server functions from src/lib/admin.functions.ts:
- src/routes/admin.index.tsx → getAdminMetrics()
- src/routes/admin.businesses.tsx → getAdminBusinesses(), approveBusiness(), lockBusiness()
- src/routes/admin.managers.tsx → getAdminManagers(), inviteManager(), removeManager()
Do not change any visual design. The waitlist page (admin.waitlist.tsx) is already wired — do not touch it.
```

---

## Phase 10 — QR Code & Events

### Prompt 10A — QR Code
```
In src/routes/dashboard/profile.tsx, wire the QR Code section to generate a real QR code using the qrcode npm package. The QR URL should be https://latinoconnecthub.co.nz/business/{slug}. The "Baixar" button should export the QR as a PNG. This feature is only available for Premium and Ultra plans — use can(plan, "qrCode") from src/lib/plans.ts.
```

### Prompt 10B — Events (Ultra only)
```
Create a Supabase migration for the events table (docs/backend-implementation-plan.md Phase 10.2). Create a new dashboard route src/routes/dashboard/events.tsx for Ultra plan users to create and manage events. Add "Eventos" to the dashboard sidebar navigation in src/components/dashboard/DashboardLayout.tsx — only visible for Ultra plan. Use can(plan, "events") from src/lib/plans.ts to gate access.
```

---

## Credit-Saving Tips

- **Attach the relevant file** when asking Lovable to modify it — this prevents it from reading the whole codebase.
- **One concern per prompt** — "create the migration" is one prompt, "create the server function" is another.
- **Say "do not change the UI"** on every backend wiring prompt — Lovable loves to redesign things.
- **Use "only create/modify X file"** to prevent scope creep.
- **After each phase**, test locally before moving to the next — fixing a broken phase costs more credits than doing it right the first time.
