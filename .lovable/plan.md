
## Goal

Make `src/lib/categories.json` (via `useCategories()`) the single source of truth for groups and categories everywhere, save BOTH group and category on each business, remove the legacy "Service / Product" concept end-to-end, and delete the now-redundant `/admin/categories` admin surface (DB table will no longer be read).

## 1. Database migration

Single migration:
- `ALTER TABLE public.businesses` add `category_group text` (nullable for now).
- Backfill `category_group` and rewrite `macro_category` from the legacy labels currently in the DB (only two distinct values exist today):
  - `'Aulas & Mentoria'` → group `education`, category key `tutoring`
  - `'Servicos Profissionais'` → group `professional`, category key `consulting`
- Drop the unused `type` column from `businesses` (no UI sets it; nothing reads it except adapter fallback).
- Drop the now-unused `public.categories` table and its policies (and `kind` column inside it).

Indexes: add `CREATE INDEX businesses_category_group_idx ON businesses(category_group)` for the directory group filter.

## 2. `categories.json` → richer `useCategories()`

Update `src/hooks/useCategories.ts` to also expose helpers needed across the app:
- `getCategoryByKey(key)` → `{ key, group, label, groupLabel, iconKey, colorKey } | undefined`
- `getGroupById(id)` → `{ id, label, iconKey, colorKey } | undefined`

These are pure lookups over the imported JSON; no extra fetching.

## 3. Server function changes (`src/lib/business.functions.ts`)

- Remove `BUSINESS_TYPES` const, the `type` field in `updateBusinessSchema`, and the `type: data.type ?? "Serviço"` default in the create branch.
- Add `category_group: z.string().trim().min(1).max(50).optional()` to `updateBusinessSchema`.
- Include `category_group` in both insert and update writes, and in the `select(...)` projection of `getBusinesses`.
- `getBusinesses` filter: when `data.category` matches a known group id, filter on `category_group`; otherwise treat it as a category key and filter on `macro_category` (replaces the client-side group-vs-key branching currently in `directory.tsx`).

## 4. Business profile form (`src/routes/dashboard.profile.tsx`)

- Replace the single category `<select>` with two selects: **Group** (from `groups`) and **Category** (categories filtered to the chosen group). Both required.
- Seed both from the loaded business (`category_group`, `macro_category`).
- Save both `category_group` (group id) and `macro_category` (category key) in `handleSave`.
- Default values: first group + first category in that group when creating from scratch.

## 5. Display surfaces

Show the translated category label everywhere instead of the raw key:
- `BusinessCard.tsx` — render `getCategoryByKey(business.macro)?.label ?? business.subcategory`.
- `DirectoryHome.tsx` featured card — same lookup for the small category line under the name.
- `business.$slug.tsx` business profile page — show group label + category label (where the category currently appears).
- `directory.tsx` filter chips — already use groups; keep as is, but route through the new server-side group filter (pass the group id straight to `getBusinesses({ category })`), and remove the client-side group-vs-key branching block.

## 6. Adapter & types (`src/lib/business.adapter.ts`, `src/lib/mock/types.ts`)

- Add `category_group: string | null` to `DbBusinessRow` and `categoryGroup` to the `Business` UI type.
- Stop deriving `Empresa/Autônomo/Autônoma` from `type` (column is gone) — set `type: "Empresa"` constant for now, since no UI surfaces this distinction anymore. (If you want this concept fully removed later, that's a follow-up — out of scope here.)

## 7. Remove `/admin/categories`

- Delete `src/routes/admin.categories.tsx`.
- Delete `src/lib/categories.functions.ts` (no remaining importers after the directory/business changes — confirm with a grep first).
- Remove `listAdminCategories`, `createAdminCategory`, `updateAdminCategory`, `deleteAdminCategory`, and the `kind` enum from `src/lib/admin.functions.ts`.
- Remove the "Categorias" nav entry / link from `AdminLayout`.

## 8. i18n

Add translation keys used by the new profile form (`profile.group_asterisk`, `profile.group_placeholder`) in `pt.json`, `es.json`, `en.json`. Category labels already come from `categories.json`.

## 9. Verification (after migration runs)

- `/` (home) and `/directory`: category chips render from JSON, group filter narrows correctly via the new server-side filter.
- Featured cards and business cards display localized category labels.
- `/dashboard/profile`: group + category selects appear, save persists both columns; legacy-data businesses now show the migrated category.
- `/business/<slug>`: shows group + category labels.
- `/admin/categories` returns 404; admin sidebar no longer links it.
- No remaining imports of `listPublicCategories`, `listAdminCategories`, or the `kind` field anywhere.

## Technical notes

- The DB migration must run before the code changes that read `category_group`, because the column doesn't exist yet. I'll request the migration first, then do the code edits once it's approved.
- `subcategory` column stays as-is (free-text, currently empty). Not in scope.
- Existing RLS policies on `businesses` don't reference `type` or `macro_category`, so no policy changes are needed.
