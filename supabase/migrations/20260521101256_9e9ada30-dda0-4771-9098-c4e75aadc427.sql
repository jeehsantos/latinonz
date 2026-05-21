ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'service';

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_kind_check;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_kind_check CHECK (kind IN ('service','product'));