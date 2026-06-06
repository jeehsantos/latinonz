## Coupons page enhancements

### 1. Redesign "New coupon" modal (`src/routes/dashboard.coupons.tsx`)
- Restructure layout: grouped sections (Basic info / Discount / Validity / Promo image) with clear labels above each field instead of placeholder-only inputs.
- Replace native `<input type="date">` with the shadcn Datepicker (Popover + Calendar, `pointer-events-auto`).
- Replace inline red error text with field-level inline validation messages (zod via react-hook-form) and a toast on submit failure. Translate all messages via i18n.
- Larger modal (max-w-lg), better dark-theme inputs (consistent neutral-950 bg, white text, focus ring in primary color), sticky footer with Cancel + Save buttons.

### 2. Better coupon card design (`dashboard.coupons.tsx`)
- Replace amber/cream card with a dark coupon card: dark gradient background (`from-neutral-900 to-neutral-800`), yellow `#facc15` accent border-left, perforated divider, white code text, neutral-300 description. Inactive state desaturated.
- Add an **Edit** (pencil) button next to Power/Trash. Opens the same modal pre-filled; reuses a new `updateCoupon` server function.
- Show discount value as a prominent badge (e.g. "20% OFF" or "$10 OFF").

### 3. Edit support (backend)
- Add `updateCoupon` in `src/lib/coupons.functions.ts` (zod-validated, owner-scoped via RLS) updating code/title/description/discount/expiry/image fields.

### 4. Promo image upload for community sharing
- Add optional **Promo image** field in the new/edit modal: "Have an image we can share in our hub? Upload it here." Uploads to existing `business-gallery` bucket under a `coupons/` prefix (or new `coupon-promos` bucket — see Technical).
- DB: add `promo_image_url text` and `promo_image_path text` columns to `coupons`. Migration via `supabase--migration`.
- Display thumbnail on coupon card.

### 5. Admin "Coupons" page
- New sidebar item in `src/components/admin/AdminLayout.tsx`: **Cupons promocionais** (icon: Ticket), route `/admin/coupons`.
- New route `src/routes/admin.coupons.tsx`: lists all active coupons across all businesses that have a promo image. Each card shows business name + logo, coupon title/code/discount/expiry, the promo image (with download button), and a copy-to-clipboard for the caption text.
- Server fn `adminListCouponPromos` in `src/lib/admin.functions.ts` (admin/manager role-gated) returning coupons joined with business name/logo, filtered to `is_active = true` and `promo_image_url not null`, ordered by `created_at desc`.

### Technical notes
- **Storage bucket**: reuse `business-gallery` (already public) with path `coupons/{business_id}/{coupon_id}-{filename}` to avoid a new bucket + RLS migration. Admin page reads via the public URL.
- **Migration**: `ALTER TABLE public.coupons ADD COLUMN promo_image_url text, ADD COLUMN promo_image_path text;` (no new GRANTs needed — table already wired).
- **Edit auth**: owner-only via existing `businesses.owner_id = auth.uid()` policy on `coupons`.
- **Datepicker**: shadcn `Calendar` + `Popover`, store as `yyyy-MM-dd` string for the server validator.
- i18n: add new keys to `pt.json`, `en.json`, `es.json` for new labels (Edit, Promo image, upload helper, admin page title, validation messages).
- No changes to public directory pages.

### Out of scope
- No changes to coupon visibility on the public business page.
- No new analytics for coupon downloads (can add later if needed).
