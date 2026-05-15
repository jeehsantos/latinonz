
## Goal

Build the full **front-end** of the Latino Connect platform from the attached canvas, while keeping the current **waitlist** as the only public surface until the admin flips a switch. No backend yet — all data is mocked. Code is structured so wiring real Supabase data later is a small, contained change.

You will be able to review the entire platform locally via a `?preview=platform` flag before any go-live.

---

## 1. Routing & "Waitlist mode" gate

A single client-side flag controls what visitors see:

- `waitlistMode = true` (default, current state) → only `/` (landing + waitlist modal) and `/admin` are reachable. Every platform route renders the waitlist landing instead.
- `waitlistMode = false` → platform is live; the old standalone landing is replaced by the new directory home.

Implementation:
- New file `src/lib/site-mode.ts` exposes `useSiteMode()` reading from `localStorage` (admin toggle) with override via `?preview=platform` query string for local review. Later this becomes a server-fn / DB-backed flag — the hook signature won't change.
- A small `<SiteGate>` wrapper inside `__root.tsx` redirects platform routes to `/` when `waitlistMode` is on (except `/admin` and the preview override).
- `/admin` page gets a new "Site Mode" panel: toggle between **Waitlist** and **Live** + a "Preview platform" link.

## 2. New routes (file-based, TanStack Start)

```
src/routes/
  index.tsx                 -> waitlist landing OR new directory home (mode-dependent)
  directory.tsx             -> full search/explorer (when in live mode, also linked from home)
  business.$slug.tsx        -> public business profile page
  planos.tsx                -> pricing page (Starter / Premium / Ultra + comparison)
  blog.tsx                  -> news/articles listing
  blog.$slug.tsx            -> article page (placeholder content)
  sobre.tsx                 -> about page (short, placeholder copy)
  contato.tsx               -> contact page
  login.tsx                 -> business owner login (UI only, no auth yet)
  cadastro.tsx              -> business signup (UI only)
  _dashboard.tsx            -> layout with sidebar + topbar (pathless)
  _dashboard/dashboard.tsx          -> overview
  _dashboard/dashboard.profile.tsx  -> business profile editor
  _dashboard/dashboard.gallery.tsx  -> photo gallery (Premium gate visual)
  _dashboard/dashboard.leads.tsx    -> leads list + detail
  _dashboard/dashboard.coupons.tsx  -> coupons (Premium)
  _dashboard/dashboard.analytics.tsx-> analytics (Premium)
  _dashboard/dashboard.settings.tsx -> settings + plan
  _dashboard/dashboard.upgrade.tsx  -> plan picker
  admin.tsx                 -> existing admin (extended with Site Mode toggle)
```

Each route gets its own `head()` with unique title/description/OG tags.

## 3. Shared / reusable components

Extracted from the canvas into `src/components/`:

- **Layout**: `SiteHeader`, `SiteFooter`, `Container`, `SectionHeading`, `Pill`, `Badge`.
- **Directory**: `SearchBar` (search + category + city + button), `CategoryCard`, `BusinessCard`, `BusinessGrid`, `EmptyState`, `SubcategoryChips`, `StatsStrip`.
- **Profile**: `BusinessHero`, `BusinessAbout`, `BusinessHours`, `BusinessGallery`, `BusinessReviews`, `ContactCard`, `CouponsCard`.
- **Plans**: `PlanCard`, `PlanComparisonTable`, `PlanBadge` (small "Starter/Premium/Ultra" chip used across the dashboard for gated features).
- **Dashboard**: `DashboardLayout` (sidebar + topbar + mobile bottom-nav, lives in `_dashboard.tsx`), `StatCard`, `LeadsTable`, `LeadDrawer`, `LockedFeatureCard` (used to show grayed-out Premium/Ultra features to Starter users), `UpgradeCTA`.
- **UI primitives** already exist via shadcn — reuse `Button`, `Input`, `Select`, `Dialog`, `Tabs`, etc., and replace the inline canvas Tailwind where it makes the components cleaner. Keep the canvas's brand styling (dark green + gold + rounded-2rem cards).

## 4. Plan-tier visibility (Starter / Premium / Ultra)

Centralized in `src/lib/plans.ts`:

```ts
export type PlanTier = "starter" | "premium" | "ultra";

export const PLAN_FEATURES = {
  profileLevel: { starter: "basic", premium: "full", ultra: "full+highlight" },
  leadChannel:  { starter: ["email"], premium: ["whatsapp"], ultra: ["email","whatsapp"] },
  reviews: { starter: true, premium: true, ultra: true },
  directMessages: { starter: false, premium: true, ultra: true },
  photoLimit: { starter: 3, premium: Infinity, ultra: Infinity },
  qrCode: { starter: false, premium: true, ultra: true },
  coupons: { starter: false, premium: true, ultra: true },
  events: { starter: false, premium: false, ultra: true },
  socialPosts: { starter: false, premium: false, ultra: true },
  whatsappCommunity: { starter: false, premium: false, ultra: true },
  topPlacement: { starter: false, premium: false, ultra: true },
} as const;

export const can = (plan: PlanTier, feature: keyof typeof PLAN_FEATURES) => ...;
```

Used everywhere:
- `PlanComparisonTable` reads it directly (single source of truth — no drift between pricing page and dashboard).
- Dashboard pages use `can(currentPlan, "coupons")` to decide whether to render the real UI or `<LockedFeatureCard requiredPlan="premium" />`.
- Public business profile uses it to decide whether to show gallery beyond 3 photos, coupons block, "Top of directory" badge, etc.

A dev-only plan switcher in the dashboard topbar (visible only with `?dev=1`) lets you preview Starter / Premium / Ultra views without auth.

## 5. Mock data layer

`src/lib/mock/` with typed fixtures: `categories.ts`, `businesses.ts`, `leads.ts`, `news.ts`, `reviews.ts`, `coupons.ts`. Each export is wrapped in a tiny accessor (`getBusinesses()`, `getBusinessBySlug(slug)`) so swapping to Supabase server functions later is a one-file change per accessor.

## 6. Internationalization

Keep the existing `useI18n()` PT/EN/ES infrastructure. **Initial pass**: add new strings to `pt.json` only (canvas is in PT) and fall back to PT in `en.json` / `es.json` with TODO markers. Translating the rest happens after you sign off on copy. This keeps the first review fast.

## 7. Performance posture (front-end only, but built with backend in mind)

- Route-level code splitting comes free with TanStack file routes — keep heavy components (`BusinessGallery`, dashboard charts placeholder) as lazy imports.
- Image-ready: `BusinessCard` and gallery accept `imageUrl?` and use `loading="lazy"` + explicit width/height to avoid CLS once real images land.
- All list rendering uses stable keys (`business.id`), `useMemo` for derived filters, and avoids inline object props on hot lists.
- Mock accessors return Promises (`async getBusinesses()`) so dashboard pages already use `useQuery` from `@tanstack/react-query` — wiring server functions later is just changing the function body.
- LCP image preload hook on `/` (when in live mode) via route `head().links`.

## 8. Out of scope for this pass

- Real authentication, real DB writes, payments, file uploads, map integration.
- Full EN/ES translations of new strings.
- Email/WhatsApp delivery of leads.
- Admin ability to edit business listings.

---

## Deliverable & review flow

1. I implement the above as a single coherent change.
2. You run locally; visit `/?preview=platform` to see the live-mode home, then click through `/directory`, `/business/tacos-do-chef`, `/planos`, `/blog`, `/login`, `/cadastro`, and `/dashboard` (use the dev plan switcher to flip Starter/Premium/Ultra).
3. The public site at `/` (without the query param) still shows the existing waitlist exactly as today — nothing visible to real users changes.
4. You review wording, layout, and gating; we iterate before flipping `waitlistMode = false` for real.

## Technical notes

- No backend changes, no migrations, no new dependencies expected (everything uses existing React/TanStack/Tailwind/shadcn/lucide).
- Existing files left untouched: `WaitlistModal.tsx`, `waitlist.functions.ts`, `categories.ts`, i18n infra, Supabase client files.
- `src/routes/index.tsx` is refactored to render `<WaitlistLanding />` or `<DirectoryHome />` based on `useSiteMode()`. Both components live in `src/components/landing/` and `src/components/directory/`.
