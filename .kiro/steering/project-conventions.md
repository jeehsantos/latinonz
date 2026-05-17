---
inclusion: always
---

# Project Conventions

## Tech Stack

- **Framework:** TanStack Start (file-based routing, SSR)
- **UI:** React + Tailwind CSS + shadcn/ui components
- **Icons:** lucide-react
- **Language:** TypeScript (strict)
- **Runtime:** Bun
- **Deploy:** Cloudflare Workers

## Brand Colors

```
Primary green:  #1A5336  (hover: #123F27, dark: #0F3D24)
Gold accent:    #EFC64E
Background:     white / gray-50
```

Always use these exact hex values. Never introduce new brand colors.

## Component Patterns

- All routes live in `src/routes/` using TanStack file-based routing
- Shared components live in `src/components/`
- UI primitives (button, input, dialog, etc.) come from `src/components/ui/` (shadcn) — reuse, don't recreate
- Every page component gets a `head()` export with unique `title`, `description`, and `og:*` meta tags
- Use `SiteShell` from `src/components/site/SiteShell.tsx` to wrap all public pages (includes `SiteHeader` + `SiteFooter`)
- Dashboard pages use `DashboardLayout` from `src/components/dashboard/DashboardLayout.tsx`

## Styling Rules

- Rounded cards: `rounded-3xl` for cards, `rounded-2xl` for inputs/buttons, `rounded-xl` for small elements
- Card borders: `border border-gray-200`
- Card shadows: `shadow-sm` (default), `shadow-2xl` (featured/highlighted)
- Font weights: `font-black` for headings, `font-extrabold` for subheadings, `font-bold` for labels
- Never use inline styles except for dynamic values (e.g. sidebar color from user preference)

## File Naming

- Routes: `src/routes/dashboard.profile.tsx` (dot-separated, not slash)
- Components: PascalCase — `BusinessCard.tsx`
- Utilities/libs: camelCase — `plans.ts`, `site-mode.ts`
- Server functions: `*.functions.ts` — `business.functions.ts`

## TypeScript

- Always type component props explicitly
- Use `type` not `interface` for props
- Avoid `any` — use `unknown` and narrow
- Server function inputs validated with `.validator()`

## Mock Data → Real Data Pattern

Mock accessors in `src/lib/mock/` are thin wrappers:
```ts
// mock/businesses.ts
export function getBusinesses() { return BUSINESSES; }
```
When wiring backend, replace the function body with a `useServerFn()` call — the component doesn't change.

## Route Structure

```
/                    → home (waitlist or directory based on site mode)
/directory           → full network listing
/business/$slug      → public business profile
/planos              → pricing page
/blog                → blog listing
/blog/$slug          → blog article
/sobre               → about
/contato             → contact
/login               → login
/cadastro            → register
/dashboard           → dashboard overview (auth required)
/dashboard/profile   → profile editor
/dashboard/gallery   → photo gallery
/dashboard/leads     → leads management
/dashboard/coupons   → coupons (Premium+)
/dashboard/analytics → analytics (Premium+)
/dashboard/settings  → account settings
/dashboard/upgrade   → plan upgrade
/admin               → admin panel (admin role required)
/admin/businesses    → manage listings
/admin/categories    → manage categories
/admin/managers      → manage team
/admin/waitlist      → waitlist data
```
