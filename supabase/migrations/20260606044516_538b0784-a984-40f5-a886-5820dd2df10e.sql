ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS promo_image_url text,
  ADD COLUMN IF NOT EXISTS promo_image_path text;