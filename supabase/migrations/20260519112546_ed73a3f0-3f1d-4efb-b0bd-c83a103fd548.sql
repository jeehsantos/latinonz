CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_business_id ON public.events(business_id);
CREATE INDEX idx_events_starts_at ON public.events(starts_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active events"
  ON public.events FOR SELECT TO anon, authenticated
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );

CREATE POLICY "Ultra owner manages own events"
  ON public.events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.id = b.owner_id
      WHERE b.id = business_id AND b.owner_id = auth.uid() AND p.plan_tier = 'ultra'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.id = b.owner_id
      WHERE b.id = business_id AND b.owner_id = auth.uid() AND p.plan_tier = 'ultra'
    )
  );