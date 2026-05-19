CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a view"
  ON public.profile_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owner reads own views"
  ON public.profile_views FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE INDEX idx_profile_views_business_id_created_at
  ON public.profile_views(business_id, created_at DESC);