-- businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  description TEXT CHECK (length(description) <= 500),
  type TEXT NOT NULL DEFAULT 'Serviço'
    CHECK (type IN ('Serviço', 'Produto', 'ONG', 'Grupo')),
  macro_category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[],
  phone TEXT,
  email TEXT,
  website TEXT,
  locations TEXT[],
  keywords TEXT[],
  logo_url TEXT,
  google_place_id TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  fast_responder BOOLEAN NOT NULL DEFAULT false,
  response_time TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_macro_category ON public.businesses(macro_category);
CREATE INDEX idx_businesses_is_active ON public.businesses(is_active);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active businesses"
  ON public.businesses FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Owner reads own business"
  ON public.businesses FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner inserts own business"
  ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner updates own business"
  ON public.businesses FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner deletes own business"
  ON public.businesses FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- business_hours
CREATE TABLE public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  day_key TEXT NOT NULL CHECK (day_key IN ('mon','tue','wed','thu','fri','sat','sun')),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (business_id, location, day_key)
);

CREATE INDEX idx_business_hours_business_id ON public.business_hours(business_id);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads hours"
  ON public.business_hours FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.is_active = true
    )
  );

CREATE POLICY "Owner manages own hours"
  ON public.business_hours FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- service_options
CREATE TABLE public.service_options (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  takeaway BOOLEAN NOT NULL DEFAULT false,
  dinein BOOLEAN NOT NULL DEFAULT false,
  delivery BOOLEAN NOT NULL DEFAULT false,
  booking BOOLEAN NOT NULL DEFAULT false,
  other TEXT
);

ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads service options"
  ON public.service_options FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.is_active = true
    )
  );

CREATE POLICY "Owner manages own service options"
  ON public.service_options FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );