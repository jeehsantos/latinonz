
## Root cause of "Forbidden: admin or manager role required"

Two auth systems exist side-by-side and they don't agree:

- **`/admin` panel** is gated by a shared `ADMIN_PASSWORD` stored in `sessionStorage` (`AdminLayout.tsx`). It does NOT sign anyone into Supabase.
- **All new admin server functions** (`inviteManager`, `getAdminBusinesses`, `getAdminMetrics`, etc.) check `auth.uid()`'s `profiles.role` for `admin`/`manager` via `requireSupabaseAuth`.

DB check: every row in `profiles` has `role = 'user'`. So even if a Supabase-logged-in user opens `/admin` after typing the password, the server-side role check still fails. Result: invite always errors out, and the metrics/businesses/managers pages silently return empty if you happen not to be signed in.

## Fix strategy

Unify on Supabase-role-based admin auth (this is what `is_admin_or_manager()` and the RLS policies already assume — the password gate is the outlier).

### 1. Database
- Promote the project owner to `admin` so the admin panel is usable end-to-end. I'll seed `profiles.role = 'admin'` for the user the owner picks (asked at apply time, or default to the first profile that signs in next).
- Add a `public.categories` table (`key`, `name`, `blurb`, `created_at`) with RLS: public can SELECT; only `is_admin_or_manager()` can INSERT/UPDATE/DELETE.

### 2. Admin auth (replace password gate)
- Rewrite `src/components/admin/AdminLayout.tsx` so:
  - It uses the real Supabase session (`supabase.auth.getSession` + `onAuthStateChange`).
  - If not signed in → redirect to `/login?redirect=/admin`.
  - If signed in but `profiles.role` ∉ `{admin, manager}` → render an "Access denied" panel with a sign-out button.
  - Otherwise render the admin shell (no password prompt, no `sessionStorage`).
- `listWaitlist` switches from `ADMIN_PASSWORD` check to `requireSupabaseAuth + requireAdminRole` (same pattern as the other admin functions). `admin.waitlist.tsx` drops the `admin-pwd` read.
- Delete the `ADMIN_PASSWORD` branch and `sessionStorage` keys entirely.

### 3. Wire each admin page to real data (kill remaining static values)

**`admin.index.tsx`**
- Extend `getAdminMetrics` to also return:
  - `byCategory`: `[{ macro_category, count }]` aggregated from `businesses` grouped by `macro_category` (active only).
  - `topSearches`: empty array for now (we have no search-events table; the page will render an empty-state "Sem dados ainda" instead of the hardcoded list).
- Page consumes both; remove the `TOP_SEARCHES` constant and the `CATEGORIES` mock import.

**`admin.businesses.tsx`**
- Extend `getAdminBusinesses` so each row includes the owner's `plan_tier` (join `profiles` via `owner_id`) and the first entry of `locations` for the "Cidade" column.
- Page uses `b.plan_tier` for `<PlanBadge>` and `b.locations?.[0]` for city (fallback `—` only when truly null).

**`admin.categories.tsx`**
- New server fns: `listCategories`, `createCategory`, `deleteCategory` (all role-gated). `listCategories` returns `name`, `key`, `blurb`, and live business count per `macro_category`.
- Page swaps `useState(CATEGORIES)` for `useQuery` + `useMutation`. Add/remove hit the DB.

**`admin.managers.tsx`** — already wired; will work once the auth fix lands.

**`admin.waitlist.tsx`** — already wired; switch to role-gated `listWaitlist` (no password param).

### 4. Verification
- Reload `/admin/managers` while signed in as the promoted admin → invite a test email → expect success (no Forbidden).
- Visit `/admin`, `/admin/businesses`, `/admin/categories` → confirm numbers/rows come from DB, no mock fallbacks visible.

## One question before applying

Which existing user should I promote to `admin`? Current `profiles`:
```
6994fa47-799b-4d87-97d7-d85e90b200c5  (user)
3a650479-0297-43b0-8ad7-20ac0bcfb7ce  (user)
```
If you tell me which one is yours (or your email), I'll seed that row to `admin`. Otherwise I'll promote both so you don't get locked out, and you can demote the other later from `/admin/managers`.
