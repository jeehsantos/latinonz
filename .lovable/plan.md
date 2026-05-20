## Goal

Stop hardcoding categories on the landing page and `/directory`. Render them from the admin-managed `categories` table, with a chosen icon and translated names/blurbs per browser language. The visual design stays exactly as it is today.

## What changes for the user

- **Admin `/admin/categories`**: when adding (or editing) a category, the admin picks an icon from a small curated list and fills name + blurb in PT, ES and EN.
- **Landing page** (categories grid) and **/directory** (category chip filter): no more static `CATEGORIES` mock — the list, names, blurbs, icons and counts all come from the database, translated to the user's current language.

## Database changes (one migration)

Extend `public.categories`:

- `icon_key text not null default 'briefcase'` — a stable string key from a fixed allowed set (e.g. `utensils`, `briefcase`, `hammer`, `car`, `music`, `heart-pulse`, `scissors`, `shopping-bag`, `book-open`, `users`, `sparkles`, `graduation-cap`, `home`, `wrench`). The frontend maps the key → Lucide icon component.
- `color_key text not null default 'slate'` — small palette token (`orange | blue | yellow | slate | purple | red | pink | teal | indigo | rose | emerald`) so the existing colored tile background is preserved.
- `name_pt text`, `name_es text`, `name_en text` — translated display names. `name` stays as the canonical PT label used by `businesses.macro_category` for joining counts.
- `blurb_pt text`, `blurb_es text`, `blurb_en text` — translated short descriptions.
- `sort_order int not null default 0` — for stable ordering on landing/directory.

Backfill `name_pt = name` and copy `blurb` into `blurb_pt` for existing rows. RLS already allows public SELECT and admin-only writes — no policy change needed.

## Server functions (`src/lib/admin.functions.ts` + new public fn)

- `listAdminCategories`: also return `icon_key`, `color_key`, `sort_order`, all `name_*` and `blurb_*` fields.
- `createAdminCategory` / new `updateAdminCategory`: accept `iconKey`, `colorKey`, `sortOrder`, `namePt/Es/En`, `blurbPt/Es/En`. Validate `iconKey` and `colorKey` against the allowed sets with Zod. `name` (canonical PT) is derived from `namePt`.
- New `src/lib/categories.functions.ts` → `listPublicCategories()`: public (no auth), returns the row shape needed by the UI plus the per-category active-business count (one aggregation query against `businesses` grouped by `macro_category`).

## Frontend changes

- New `src/lib/category-icons.ts`: maps `icon_key → LucideIcon` and `color_key → { text, bg }` Tailwind class pair (mirrors the current mock styling so the design is identical).
- New `src/hooks/useCategories.ts`: `useQuery` wrapper around `listPublicCategories` that picks the right `name_*` / `blurb_*` based on `useI18n().locale`, with fallback to PT.
- `src/components/directory/DirectoryHome.tsx`: remove `CATEGORIES` import; render the categories grid from `useCategories()`. Trust strip's "9" categories number becomes the live count. Loading state renders skeleton tiles in the same grid.
- `src/routes/directory.tsx`: remove `CATEGORIES` import; render the chip row from `useCategories()`. The chip's `onClick` still sets `search.category` to the canonical PT `name` so the existing filter against `businesses.macro_category` keeps working.
- `src/routes/admin.categories.tsx`: replace the inline add form with a dialog containing icon picker (grid of Lucide icons), color picker (swatch row), and the three name+blurb language pairs. Inline edit on each row reuses the same dialog.

## i18n

- Add `admin.categories.*` strings (form labels, language tabs, icon/color picker labels) to `pt.json`, `es.json`, `en.json` per the project i18n rule.
- No new keys are needed for category names/blurbs themselves — they are stored per-row in the DB.

## Things deliberately not changed

- `src/lib/categories.ts` (the canonical PT enum used for `macro_category` on business profiles) stays as-is so existing businesses and the cadastro flow keep matching.
- The visual design of the landing categories grid and the `/directory` chip row is preserved 1:1 — same tile shape, same colored icon bubble, same chip styling.
- No backend logic outside categories is touched.
