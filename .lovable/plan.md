# Mobile-First UX Overhaul

Goal: Rework the mobile experience (≤ 768px) across the public site and the business dashboard with a full mobile-first rethink — denser hierarchy, fewer competing elements per viewport, easier search, and an app-like bottom navigation. Desktop layouts (≥ lg) stay exactly as they are today; every change is gated behind Tailwind responsive prefixes (`md:`, `lg:`) so desktop output is unchanged.

## Global pieces (built once, used everywhere)

1. **`MobileBottomNav` (public site)** — fixed bottom tab bar shown only `lg:hidden`, with 4 tabs: Home, Directory, Blog, Account (Login if signed out / Dashboard if signed in). Active tab uses `#facc15`. Mounted in `SiteShell`. Adds `pb-20 lg:pb-0` spacer so content isn't hidden behind it.
2. **`MobileDashboardNav`** — same pattern for the dashboard, 5 slots: Home, Profile, Leads (with badge), Coupons, More (opens a sheet with Gallery, Events, Analytics, Settings, Upgrade, Sign out). Replaces the current hamburger drawer on mobile.
3. **`SiteHeader` mobile** — slim header on mobile: logo left, language switch + login icon right. Remove hamburger (bottom nav replaces it). Desktop unchanged.
4. **Safe-area padding** — add `pb-[env(safe-area-inset-bottom)]` on bottom nav to respect iOS home indicator.

## Page-by-page mobile changes (desktop untouched)

### Public site

- **Home (`DirectoryHome`)**
  - Hero: smaller headline (`text-3xl`), tighter vertical padding, single-line CTA pill.
  - Search bar: collapse to single primary input + a "Filters" button on mobile that opens a `Sheet` containing Category + City selects. Desktop keeps the 3-field inline form.
  - Trust strip: scrollable horizontal chips on mobile instead of 3-col grid.
  - Categories: 2-col grid with smaller cards, hide group description, show 6 (with "See all" link). Desktop unchanged at 5-col.
  - Featured: 1-col stack on mobile (no `sm:grid-cols-2` until `md`), tighter cards.
  - CTA section: smaller padding, single-column.

- **Directory (`/directory`)**
  - Replace inline `SearchBar` with sticky search input + "Filters" pill at top on mobile; full filter sheet on tap with category, city, sort, type. Active filter chips below input. Desktop unchanged.
  - Results: 1-col cards on mobile, condensed `BusinessCard` variant (smaller image aspect, no description if narrow, location + rating in one row).
  - Pagination/empty states scaled down.

- **Business detail (`business.$slug`)**
  - Stack hero image + info vertically on mobile, sticky bottom action bar ("Call / WhatsApp / Save") instead of inline buttons.
  - Tabs (About / Reviews / Coupons / Gallery) become horizontally scrollable on mobile.
  - Reviews and gallery render as single column.

- **Blog list + post**
  - 1-col card list with larger touch targets; remove sidebar on mobile.
  - Post: reduce prose size, add sticky back button.

- **Contato, Sobre, Planos**
  - Hero text scaled down, plans render as vertical stack of cards (no horizontal scroll), comparison table converts to per-plan accordion on mobile.

- **Cadastro / Login**
  - Full-bleed form, larger inputs (min-h-12), single-column, sticky submit button at bottom on mobile.

### Business dashboard

- **`DashboardLayout`**
  - Hide left sidebar on mobile (already hidden); replace hamburger drawer with `MobileDashboardNav` (bottom tabs + "More" sheet).
  - Header on mobile: logo left, plan badge + avatar right (drop the business name/location text).
  - Main: reduce padding to `p-4` on mobile.

- **Dashboard index** — stat cards stack 1-col (currently feels cramped at sm).
- **Profile** — group fields into collapsible sections (Basic, Contact, Location, Description, Photos) on mobile; sticky "Save" at bottom.
- **Coupons** — list view on mobile (avatar + code + status), tap to expand; "New coupon" modal already redesigned, just verify sheet variant on mobile (use `Drawer` from bottom).
- **Events, Gallery, Leads, Analytics, Settings** — 1-col layout, larger touch targets, convert tables to card lists on mobile, sticky primary CTA.

## Technical Notes

- All changes use Tailwind responsive variants; **no desktop class is removed** — new mobile styles slot in as the base and existing classes are kept behind `md:`/`lg:`.
- Bottom nav uses `fixed bottom-0 inset-x-0 lg:hidden`, `backdrop-blur`, `border-t border-white/10`, `bg-neutral-950/95`.
- Tables → card lists handled via `hidden md:block` / `md:hidden` duplicates only where structure differs too much for pure utility tweaking.
- Reusable `<MobileFilterSheet>` (shadcn `Sheet`) used by Home and Directory.
- Touch targets: minimum 44px tappable height on all primary actions.
- No backend/route/business-logic changes — purely presentational components and Tailwind classes.

## Out of scope
- Admin panel (per your selection).
- Auth flow behavior changes.
- Any desktop visual change.
- New data, endpoints, or i18n keys beyond labels for "Filters", "More", and bottom-nav tab names.

## Rollout

Single PR-style batch: build `MobileBottomNav`, `MobileDashboardNav`, `MobileFilterSheet`, then update each route/component listed above. Verify on 390×844 viewport (current preview) and a desktop width to confirm desktop is byte-identical visually.