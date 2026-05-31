
CREATE TABLE public.business_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  location TEXT NOT NULL,
  address_street TEXT,
  address_suburb TEXT,
  phone TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, location)
);

CREATE INDEX idx_business_branches_business ON public.business_branches(business_id);

GRANT SELECT ON public.business_branches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_branches TO authenticated;
GRANT ALL ON public.business_branches TO service_role;

ALTER TABLE public.business_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads branches"
ON public.business_branches
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses b
  WHERE b.id = business_branches.business_id AND b.is_active = true
));

CREATE POLICY "Owner manages own branches"
ON public.business_branches
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses b
  WHERE b.id = business_branches.business_id AND b.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses b
  WHERE b.id = business_branches.business_id AND b.owner_id = auth.uid()
));

CREATE TRIGGER update_business_branches_updated_at
BEFORE UPDATE ON public.business_branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
