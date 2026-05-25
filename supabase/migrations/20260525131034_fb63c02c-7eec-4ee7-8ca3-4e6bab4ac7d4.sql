CREATE TABLE public.service_option_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  icon_key text NOT NULL DEFAULT 'sparkles',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_option_items_business ON public.service_option_items(business_id);

ALTER TABLE public.service_option_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads service option items"
ON public.service_option_items
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses b
  WHERE b.id = service_option_items.business_id AND b.is_active = true
));

CREATE POLICY "Owner manages own service option items"
ON public.service_option_items
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses b
  WHERE b.id = service_option_items.business_id AND b.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses b
  WHERE b.id = service_option_items.business_id AND b.owner_id = auth.uid()
));