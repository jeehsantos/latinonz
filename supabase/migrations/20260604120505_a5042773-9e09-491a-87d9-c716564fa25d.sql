
-- 1. Add category_group column to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category_group text;

-- 2. Backfill known legacy macro_category values
UPDATE public.businesses
SET category_group = 'education', macro_category = 'tutoring'
WHERE macro_category = 'Aulas & Mentoria';

UPDATE public.businesses
SET category_group = 'professional', macro_category = 'consulting'
WHERE macro_category = 'Servicos Profissionais';

-- 3. Index for group filtering
CREATE INDEX IF NOT EXISTS businesses_category_group_idx ON public.businesses(category_group);

-- 4. Drop unused type column
ALTER TABLE public.businesses DROP COLUMN IF EXISTS type;

-- 5. Drop categories table (replaced by src/lib/categories.json)
DROP TABLE IF EXISTS public.categories CASCADE;
