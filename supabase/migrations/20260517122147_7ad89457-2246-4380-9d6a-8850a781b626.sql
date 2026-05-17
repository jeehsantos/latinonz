-- business_photos table
CREATE TABLE public.business_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_photos_business_id ON public.business_photos(business_id);
CREATE INDEX idx_business_photos_position ON public.business_photos(business_id, position);

ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads photos"
  ON public.business_photos FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );

CREATE POLICY "Owner manages own photos"
  ON public.business_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-gallery', 'business-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read
CREATE POLICY "Public read business-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-logos');

CREATE POLICY "Public read business-gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-gallery');

-- Storage policies: owner write (folder name = auth.uid())
CREATE POLICY "Owner uploads own logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner updates own logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner deletes own logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner uploads own gallery"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner updates own gallery"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner deletes own gallery"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );