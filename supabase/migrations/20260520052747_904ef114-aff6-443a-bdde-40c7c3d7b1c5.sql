
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon_key text NOT NULL DEFAULT 'briefcase',
  ADD COLUMN IF NOT EXISTS color_key text NOT NULL DEFAULT 'slate',
  ADD COLUMN IF NOT EXISTS name_pt text,
  ADD COLUMN IF NOT EXISTS name_es text,
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS blurb_pt text,
  ADD COLUMN IF NOT EXISTS blurb_es text,
  ADD COLUMN IF NOT EXISTS blurb_en text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

UPDATE public.categories
SET name_pt = COALESCE(name_pt, name),
    blurb_pt = COALESCE(blurb_pt, blurb);

ALTER TABLE public.categories
  ADD CONSTRAINT categories_icon_key_chk
  CHECK (icon_key IN (
    'utensils','briefcase','hammer','car','music','heart-pulse','scissors',
    'shopping-bag','book-open','users','sparkles','graduation-cap','home',
    'wrench','camera','plane','laptop','baby','paw-print','dumbbell'
  ));

ALTER TABLE public.categories
  ADD CONSTRAINT categories_color_key_chk
  CHECK (color_key IN (
    'orange','blue','yellow','slate','purple','red','pink','teal','indigo','rose','emerald'
  ));
